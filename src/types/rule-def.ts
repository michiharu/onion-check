import { Merge } from './util';

const ruleTypes = ['boolean', 'number', 'bigint', 'string', 'array', 'object', 'ignore'] as const;
type RuleType = typeof ruleTypes[number];
type CheckRuleType = Exclude<RuleType, 'ignore'>;

type ErrorCode<T> = T & { [key in `${keyof T}ErrorCode`]?: string };

export type AND<T> = { and?: Conditional<T>[] } & { or?: undefined };
export type OR<T> = { or?: Conditional<T>[] } & { and?: undefined };
export type Conditional<T> = (T & { and?: undefined; or?: undefined }) | AND<T> | OR<T>;

export type EqNeType = boolean | number | bigint | string;
export type EqNeRules<T extends EqNeType> = Merge<ErrorCode<{ eq?: T; ne?: T }>>;

export type LimitType = number | bigint | string;
export type LimitRules<T extends LimitType> = Merge<
  ErrorCode<{ ge?: T; gt?: T; le?: T; lt?: T; between?: [T, T]; oneOf?: T[] }> & EqNeRules<T>
>;

export type ExistenceRules = Merge<
  ErrorCode<{
    required?: boolean;
    disallowUndefined?: boolean;
    disallowNull?: boolean;
    disallowNokey?: boolean;
  }>
>;
export type CreateRule<T extends RuleType, S> = Merge<
  { type: T; typeErrorCode?: string; label?: string } & ExistenceRules & S
>;
export type BaseRuleDef = CreateRule<CheckRuleType, {}>;

export type BooleanRules = Merge<EqNeRules<boolean>>;
export type BooleanRuleDef = CreateRule<'boolean', BooleanRules>;

export type NumberRules = Merge<LimitRules<number>>;
export type NumberRuleDef = CreateRule<'number', Conditional<NumberRules>>;

export type BigIntRules = Merge<LimitRules<bigint>>;
export type BigIntRuleDef = CreateRule<'bigint', Conditional<BigIntRules>>;

export type StringBaseRules = Merge<
  LimitRules<string> &
    ErrorCode<{
      beginsWith?: string;
      contains?: string;
      notContains?: string;
      pattern?: RegExp;
      notPattern?: RegExp;
    }>
>;
export type StringRules = Merge<
  StringBaseRules & { length?: LimitRules<number> } & ErrorCode<{
      asBoolean?: BooleanRules;
      asNumber?: NumberRules;
      asBigInt?: BigIntRules;
    }>
>;
export type StringRuleDef = CreateRule<'string', Conditional<StringRules>>;

export type ArrayMetaRules = { length?: Conditional<NumberRules> };
export type ArrayRuleDef<E> = CreateRule<'array', ArrayMetaRules & { elements: RuleDef<E> }>;

export type RuleMapping<T extends object> = { [key in keyof T]-?: RuleDef<T[key]> };
export type ObjectMetaRules = ErrorCode<{ disallowUndefinedKeys?: boolean }>;
export type ObjectRuleDef<T extends object> = CreateRule<'object', ObjectMetaRules & { keys: RuleMapping<T> }>;

export type IgnoreRuleDef = { type: 'ignore' };

export type RuleDef<T = any> = T extends boolean
  ? BooleanRuleDef
  : T extends number
  ? NumberRuleDef
  : T extends bigint
  ? BigIntRuleDef
  : T extends string
  ? StringRuleDef
  : T extends (infer E)[]
  ? ArrayRuleDef<E>
  : T extends object
  ? ObjectRuleDef<T>
  : IgnoreRuleDef;

type WithoutErrorCode<T> = T extends `${string}ErrorCode` ? never : T;
export type Rule = WithoutErrorCode<keyof ExistenceRules | 'type' | keyof StringRules | keyof ObjectMetaRules>

export type DefaultRules = {
  existence?: ExistenceRules;
  array?: ArrayMetaRules;
  object?: ObjectMetaRules;
};
