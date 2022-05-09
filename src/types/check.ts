import {
  ArrayRuleDef,
  BaseRuleDef,
  BigIntRuleDef,
  BooleanRuleDef,
  Conditional,
  EqNeRules,
  EqNeType,
  LimitRules,
  LimitType,
  NumberRuleDef,
  ObjectRuleDef,
  Rule,
  RuleDef,
  StringBaseRules,
  StringRuleDef,
  StringRules,
} from './rule-def';
import { TypeOf } from './type-of';

export type ErrorResult = {
  path: (string | number)[];
  rule: { name: string; value: any };
  value: unknown;
  label?: string;
  code: string;
};
export type Arg<R, V> = {
  rule: R;
  value: V;
  type: TypeOf;
  path: (string | number)[];
  label?: string;
};
export type CheckFunction<R, V = unknown> = (arg: Arg<R, V>) => ErrorResult[];
export type CreateErrorResult = (rule: Rule, arg: Arg<any, any>) => ErrorResult;

type Checker<R, V> = (args: Arg<R, V>) => ErrorResult[];
export type CheckConditionalRules = <R, V = unknown>(
  args: Arg<Conditional<R>, V>,
  checker: Checker<R, V>
) => ErrorResult[];
export type CheckEqNe = <T extends EqNeType>(arg: Arg<EqNeRules<T>, unknown>) => ErrorResult[];
export type CheckLimit = <T extends LimitType>(arg: Arg<LimitRules<T>, unknown>) => ErrorResult[];
export type CheckBase = CheckFunction<BaseRuleDef>;

export type CheckStringBaseRules = CheckFunction<StringBaseRules, string>;
export type CheckStringRules = CheckFunction<StringRules, string>;

export type Check = CheckFunction<RuleDef>;
export type CheckBoolean = CheckFunction<BooleanRuleDef>;
export type CheckNumber = CheckFunction<NumberRuleDef>;
export type CheckBigInt = CheckFunction<BigIntRuleDef>;
export type CheckString = CheckFunction<StringRuleDef>;
export type CheckArray = CheckFunction<ArrayRuleDef<any>>;
export type CheckObject = CheckFunction<ObjectRuleDef<object>>;
