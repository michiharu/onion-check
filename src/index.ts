import './extensions/array';
import './extensions/set';

type ObjData = { [key in string]: Data };
type Data = boolean | number | bigint | string | Data[] | ObjData;
const ruleTypes = ['boolean', 'number', 'bigint', 'string', 'array', 'object'] as const;
type RuleType = typeof ruleTypes[number];

type ErrorCode<T> = T & { [key in `${keyof T}ErrorCode`]?: string };
type Conditional<T> = T | { and: T[] } | { or: T[] };
type Limitation<T> = { eq?: T; ne?: T; ge?: T; gt?: T; le?: T; lt?: T; between?: [T, T]; oneOf?: T[] };

type NullableRules = ErrorCode<{
  required?: boolean;
  disallowUndefined?: boolean;
  disallowNull?: boolean;
  disallowNokey?: boolean;
}>;
type Rule<T extends RuleType, S> = { type: T; typeErrorCode?: string; label?: string } & NullableRules & S;

type BooleanRules = ErrorCode<{ ne?: boolean; eq?: boolean }>;
type BooleanRuleDef = Rule<'boolean', BooleanRules>;

type NumberRules = ErrorCode<Limitation<number>>;
type NumberRuleDef = Rule<'number', Conditional<NumberRules>>;

type BigIntRules = ErrorCode<Limitation<bigint>>;
type BigIntRuleDef = Rule<'bigint', Conditional<BigIntRules>>;

type StringBaseRules = ErrorCode<
  Limitation<string> & {
    beginsWith?: string;
    contains?: string;
    notContains?: string;
    pattern?: RegExp;
    ngPattern?: RegExp;
    length?: Limitation<number>;
  }
>;
type StringRules =
  | Conditional<StringBaseRules>
  | { asBoolean?: Conditional<BooleanRules> }
  | { asNumber?: Conditional<NumberRules> }
  | { asBigInt?: Conditional<BigIntRules> };
type StringRuleDef = Rule<'string', StringRules>;

type Element<T, S> = T extends (infer E)[] ? (E extends S ? E : never) : never;
type ElementRule<T> = RuleDef<Element<T, Data>>;
type ArrayMetaRules = ErrorCode<{ length?: NumberRules }>;
type ArrayRules<T extends Data[]> = Conditional<ArrayMetaRules> & { elements: ElementRule<T> };
type ArrayRuleDef<T extends Data[]> = Rule<'array', ArrayRules<T>>;

type RuleMapping<T extends ObjData> = { [key in keyof T]-?: RuleDef<T[key]> };
type ObjectMetaRules = ErrorCode<{ disallowUndefinedKeys?: boolean }>;
type ObjectRuleDef<T extends ObjData> = Rule<'object', ObjectMetaRules & { keys: RuleMapping<T> }>;

type RuleDef<T extends Data = Data> = T extends boolean
  ? BooleanRuleDef
  : T extends number
  ? NumberRuleDef
  : T extends bigint
  ? BigIntRuleDef
  : T extends string
  ? StringRuleDef
  : T extends Data[]
  ? ArrayRuleDef<T>
  : T extends ObjData
  ? ObjectRuleDef<T>
  : never;

type StringRuleConfig = Conditional<StringBaseRules> & {
  asBoolean?: Conditional<BooleanRules>;
  asNumber?: Conditional<NumberRules>;
  asBigInt?: Conditional<BigIntRules>;
};

type RuleConfigByType<T extends RuleType> = T extends 'boolean'
  ? BooleanRules
  : T extends 'number'
  ? NumberRules
  : T extends 'bigint'
  ? BigIntRules
  : T extends 'string'
  ? StringRuleConfig
  : T extends 'array'
  ? ArrayMetaRules
  : ObjectMetaRules;

type Config = { [key in RuleType]?: RuleConfigByType<key> } & { nullable?: NullableRules; typeErrorCode?: string };

type ErrorResult = { path: (string | number)[]; value: unknown; label?: string; code: string };

type CheckArgs<T extends Data> = {
  conf: Config;
  rule: RuleDef<T>;
  value: T;
  path: (string | number)[];
};

type CheckObjectArgs<T extends ObjData> = {
  conf: Config;
  rule: RuleDef<T>;
  value: T;
  path: (string | number)[];
};

const deepTypes = [
  'array',
  'bigint',
  'date',
  'error',
  'function',
  'generatorfunction',
  'generator',
  'regexp',
  'symbol',
] as const;
type DeepType = typeof deepTypes[number];
const typeOf = (value: unknown) => typeof value;
type TypeOf = ReturnType<typeof typeOf> | DeepType | 'null' | 'nokey';
const nullableTypes = ['undefined', 'null', 'nokey'] as const;
type NullableType = typeof nullableTypes[number];

export const getType = (value: unknown): TypeOf => {
  if (value === null) return 'null';
  var deepType: DeepType = Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
  if (/^(array|bigint|date|error|function|generatorfunction|generator|regexp|symbol)$/.test(deepType)) return deepType;
  if (typeof value === 'object' || typeof value === 'function') return 'object';
  return typeof value;
};

export const getTypeFromParent = (obj: unknown, key: string): TypeOf => {
  const value = obj[key];
  const keySet = new Set(Object.keys(obj));
  if (!keySet.has(key)) return 'nokey';
  return getType(value);
};

const checkRequiredRule = <T extends Data>(type: TypeOf, { conf, rule, value, path }: CheckArgs<T>): ErrorResult[] => {
  const required: boolean = rule.required ?? conf.nullable.required ?? false;
  if (!required) return [];
  if (!(nullableTypes as unknown as TypeOf).includes(type)) return [];
  const code = rule.requiredErrorCode ?? conf.nullable.requiredErrorCode ?? 'required';
  const { label } = rule;
  return [{ code, value, path, label }];
};
const isNullable = (type: TypeOf): type is NullableType => (nullableTypes as unknown as TypeOf).includes(type);

const checkNullableDisallowRule = <T extends Data>(type: TypeOf, args: CheckArgs<T>): ErrorResult[] => {
  const { conf, rule, value, path } = args;
  if (!isNullable(type)) return [];
  switch (type) {
    case 'undefined': {
      const disallowUndefined = rule.disallowUndefined ?? conf.nullable.disallowUndefined;
      if (!disallowUndefined) return [];
      const code = rule.disallowUndefinedErrorCode ?? conf.nullable.disallowUndefinedErrorCode ?? 'disallowUndefined';
      const { label } = rule;
      return [{ code, value, path, label }];
    }
    case 'null': {
      const disallowNull = rule.disallowNull ?? conf.nullable.disallowNull;
      if (!disallowNull) return [];
      const code = rule.disallowNokeyErrorCode ?? conf.nullable.disallowNullErrorCode ?? 'disallowNull';
      const { label } = rule;
      return [{ code, value, path, label }];
    }
    case 'nokey': {
      const disallowNokey = rule.disallowNokey ?? conf.nullable.disallowNokey;
      if (!disallowNokey) return [];
      const code = rule.disallowNokeyErrorCode ?? conf.nullable.disallowNokeyErrorCode ?? 'disallowNokey';
      const { label } = rule;
      return [{ code, value, path, label }];
    }
  }
};

const checkNullableRules = <T extends Data>(type: TypeOf, args: CheckArgs<T>): ErrorResult[] => {
  const requiredErrors = checkRequiredRule(type, args);
  if (requiredErrors.length !== 0) return requiredErrors;
  const disallowErrors = checkNullableDisallowRule(type, args);
  return disallowErrors;
};

const checkType = <T extends Data>(type: TypeOf, { conf, rule, value, path }: CheckArgs<T>): ErrorResult[] => {
  if (rule.type === type) return [];
  const code = rule.typeErrorCode ?? conf.typeErrorCode ?? 'type';
  const { label } = rule;
  return [{ code, value, path, label }];
};

const isBoolean = (value: unknown): value is boolean => getType(value) === 'boolean';
const isNumber = (value: unknown): value is number => getType(value) === 'number';
const isBigint = (value: unknown): value is bigint => getType(value) === 'bigint';
const isString = (value: unknown): value is string => getType(value) === 'string';
const isArray = (value: unknown): value is Data[] => getType(value) === 'array';
const isObject = (value: unknown): value is ObjData => getType(value) === 'object';

const checkBoolean = <T extends boolean>({ conf, rule, value, path }: CheckArgs<T>): ErrorResult[] => {
  return [];
};

const checkNumber = <T extends number>({ conf, rule, value, path }: CheckArgs<T>): ErrorResult[] => {
  return [];
};
const checkBigInt = <T extends bigint>({ conf, rule, value, path }: CheckArgs<T>): ErrorResult[] => {
  return [];
};
const checkString = <T extends string>({ conf, rule, value, path }: CheckArgs<T>): ErrorResult[] => {
  return [];
};
const checkArray = <T extends Data[]>({ conf, rule, value, path }: CheckArgs<T>): ErrorResult[] => {
  return [];
};

const objectKeys = <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[];

const checkObjectDisallowUndefinedKeys = <T extends ObjData>(args: CheckArgs<T>): ErrorResult[] => {
  const { conf, rule, value, path } = args;
  const disallowUndefinedKeys: boolean = rule.disallowUndefinedKeys ?? conf.object.disallowUndefinedKeys ?? false;
  if (!disallowUndefinedKeys) return [];
  const ruleKeySet = objectKeys(rule.keys).set();
  const dataKeySet = objectKeys(value).set();
  if (ruleKeySet.equals(dataKeySet)) return [];
  const code = rule.typeErrorCode ?? conf.typeErrorCode ?? 'type';
  const { label } = rule;
  return [{ code, value, path, label }];
};

const checkObject = <T extends ObjData>(args: CheckObjectArgs<T>): ErrorResult[] => {
  const { conf } = args;

  const errors: ErrorResult[] = [checkObjectDisallowUndefinedKeys(args)].flatMap((error) => error);

  const childrenErrors = objectKeys(args.rule.keys).flatMap((key) => {
    const rule = args.rule.keys[key];
    const value = args.value[key];
    const type = getTypeFromParent(args.value, key);
    const path = args.path.concat([key]);

    const requiredErrors = checkNullableRules(type, { conf, rule, value, path });
    if (requiredErrors.length !== 0) return requiredErrors;

    const typeErrors = checkType(type, { conf, rule, value, path });
    if (typeErrors.length !== 0) return typeErrors;

    if (rule.type === 'boolean' && isBoolean(value)) return checkBoolean({ conf, rule, value, path });
    if (rule.type === 'number' && isNumber(value)) return checkNumber({ conf, rule, value, path });
    if (rule.type === 'bigint' && isBigint(value)) return checkBigInt({ conf, rule, value, path });
    if (rule.type === 'string' && isString(value)) return checkString({ conf, rule, value, path });
    if (rule.type === 'array' && isArray(value)) return checkArray({ conf, rule, value, path });
    if (rule.type === 'object' && isObject(value)) return checkObject({ conf, rule, value, path });
    throw new Error();
  });
  return errors.concat(childrenErrors);
};

const check =
  <T extends ObjData>(conf: Config, rules: RuleMapping<T>) =>
  (value: ObjData): ErrorResult[] => {
    if (typeof value !== 'object') throw new Error('The check function takes an object as an argument.');
    const rule: ObjectRuleDef<T> = { type: 'object', keys: rules };
    return checkObject({ conf, rule, value, path: [] });
  };

const rules =
  (conf: Config) =>
  <T extends ObjData>(rules: RuleMapping<T>) => {
    if (typeof rules !== 'object') throw new Error('The rules function takes an rule object as an argument.');
    return { check: check(conf, rules) };
  };

export const config = (conf: Config = {}) => ({ rules: rules(conf) });
