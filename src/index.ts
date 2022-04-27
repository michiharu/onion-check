const typeOf = (value: unknown) => typeof value;
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
type TypeOf = ReturnType<typeof typeOf> | DeepType | 'null' | 'nokey';

export const returnType = (obj: unknown, key: string): TypeOf => {
  const value = obj[key];
  const keySet = new Set(Object.keys(obj));
  if (!keySet.has(key)) return 'nokey';
  if (value === null) return 'null';
  var deepType: DeepType = Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
  if (/^(array|bigint|date|error|function|generatorfunction|generator|regexp|symbol)$/.test(deepType)) return deepType;
  if (typeof value === 'object' || typeof value === 'function') return 'object';
  return typeof value;
};

type ObjData = { [key in string]: Data };
type Data = boolean | number | bigint | string | Data[] | ObjData;
const ruleTypes = ['boolean', 'number', 'bigint', 'string', 'array', 'object'] as const;
type RuleType = typeof ruleTypes[number];

type ErrorCode<T> = T & { [key in `${keyof T | 'type'}ErrorCode`]?: string };
type Conditional<T> = T | { and: T[] } | { or: T[] };
type ConditionWithErrorCode<T> = Conditional<ErrorCode<T>>;
type Limitation<T> = { eq?: T; ne?: T; ge?: T; gt?: T; le?: T; lt?: T; between?: [T, T]; oneOf?: T[] };

type RequiredRules = ErrorCode<{
  required?: boolean;
  notNull?: boolean;
  notUndefined?: boolean;
  requiredKey?: boolean;
}>;
type Rule<T extends RuleType, S> = { type: T; label?: string } & RequiredRules & S;

type BooleanRules = { ne?: boolean; eq?: boolean };
type BooleanRuleDef = Rule<'boolean', ConditionWithErrorCode<BooleanRules>>;

type NumberRules = Limitation<number>;
type NumberRuleDef = Rule<'number', ConditionWithErrorCode<NumberRules>>;

type BigIntRules = Limitation<bigint>;
type BigIntRuleDef = Rule<'bigint', ConditionWithErrorCode<BigIntRules>>;

type StringBaseRules = Limitation<string> & {
  beginsWith?: string;
  contains?: string;
  notContains?: string;
  pattern?: RegExp;
  ngPattern?: RegExp;
  length?: Limitation<number>;
};
type StringRules =
  | ConditionWithErrorCode<StringBaseRules>
  | { asBoolean?: ConditionWithErrorCode<BooleanRules> }
  | { asNumber?: ConditionWithErrorCode<NumberRules> }
  | { asBigInt?: ConditionWithErrorCode<BigIntRules> };
type StringRuleDef = Rule<'string', StringRules>;

type Element<T, S> = T extends (infer E)[] ? (E extends S ? E : never) : never;
type ElementRule<T> = RuleDef<Element<T, Data>>;
type ArrayRules<T extends Data[]> = ConditionWithErrorCode<{ length?: NumberRules }> & { elements: ElementRule<T> };
type ArrayRuleDef<T extends Data[]> = Rule<'array', ArrayRules<T>>;

type RuleMapping<T extends ObjData> = { [key in keyof T]-?: RuleDef<T[key]> };
type RuleObj<T extends ObjData> = Rule<'object', { keys: RuleMapping<T> }>;

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
  ? RuleObj<T>
  : never;

type RequiredErrorCodeKey = keyof RequiredRules;
type BooleanErrorCodeKey = `boolean${Capitalize<keyof BooleanRules>}`;
type NumberErrorCodeKey = `number${Capitalize<keyof NumberRules>}`;
type BigIntErrorCodeKey = `bigint${Capitalize<keyof BigIntRules>}`;
type StringErrorCodeKey = `string${Capitalize<keyof StringBaseRules>}`;
type ErrorCodeKey =
  | 'type'
  | RequiredErrorCodeKey
  | BooleanErrorCodeKey
  | NumberErrorCodeKey
  | BigIntErrorCodeKey
  | StringErrorCodeKey

type ErrorCodeConfig = { [key in ErrorCodeKey]?: string };
type Config = { errorCode?: ErrorCodeConfig };

type ErrorResult = { path: (string | number)[]; value: unknown; label?: string; code: string };

type CheckArgs<T> = {
  conf: Config;
  rule: T;
  value: unknown;
  type: TypeOf;
  path: (string | number)[];
};

const checkBoolean = ({ conf, rule, value, type, path }: CheckArgs<BooleanRuleDef>): ErrorResult[] => {
  return [];
};
const checkNumber = ({ conf, rule, value, type, path }: CheckArgs<NumberRuleDef>): ErrorResult[] => {
  return [];
};
const checkBigInt = ({ conf, rule, value, type, path }: CheckArgs<BigIntRuleDef>): ErrorResult[] => {
  return [];
};
const checkString = ({ conf, rule, value, type, path }: CheckArgs<StringRuleDef>): ErrorResult[] => {
  return [];
};
const checkArray = <T extends Data[]>({ conf, rule, value, type, path }: CheckArgs<ArrayRuleDef<T>>): ErrorResult[] => {
  return [];
};

const objectKeys = <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[];

const checkRequiredRules = ({ conf, rule, value, type, path }: CheckArgs<RuleDef>): ErrorResult[] => {
  const { label } = rule;
  const nullable: TypeOf[] = ['null', 'undefined', 'nokey'];
  if (rule.required && nullable.includes(type)) {
    const code = rule.requiredErrorCode ?? conf.errorCode?.required ?? 'required';
    return [{ path, value, label, code }];
  }
  return [];
};

const checkType = ({ conf, rule, value, type, path }: CheckArgs<RuleDef>): ErrorResult[] => {
  const { label } = rule;
  if (rule.type !== type) {
    const code = rule.typeErrorCode ?? conf.errorCode?.type ?? 'type';
    return [{ path, value, label, code }];
  }
  return [];
};

const checkObject = <T extends ObjData>(args: CheckArgs<RuleObj<T>>): ErrorResult[] => {
  const { conf } = args;
  return objectKeys(args.rule.keys).flatMap((key) => {
    const rule = args.rule.keys[key];
    const value = args.value[key];
    const type = returnType(args.value, key);
    const path = args.path.concat([key]);
    const requiredErrors = checkRequiredRules({ conf, rule, value, type, path });
    if (requiredErrors.length !== 0) return requiredErrors;
    const typeErrors = checkType({ conf, rule, value, type, path });
    if (typeErrors.length !== 0) return typeErrors;
    switch (rule.type) {
      case 'boolean':
        return checkBoolean({ conf, rule, value, type, path });
      case 'number':
        return checkNumber({ conf, rule, value, type, path });
      case 'bigint':
        return checkBigInt({ conf, rule, value, type, path });
      case 'string':
        return checkString({ conf, rule, value, type, path });
      case 'array':
        return checkArray({ conf, rule, value, type, path });
      case 'object':
        return checkObject({ conf, rule, value, type, path });
      default:
        throw new Error();
    }
  });
};

const check =
  <T extends ObjData>(conf: Config, rules: RuleMapping<T>) =>
  (value: unknown): ErrorResult[] => {
    if (typeof value !== 'object') throw new Error('The check function takes an object as an argument.');
    const rule: RuleObj<T> = { type: 'object', keys: rules };
    return checkObject({ conf, rule, value, type: 'object', path: [] });
  };

const rules =
  (conf: Config) =>
  <T extends ObjData>(rules: RuleMapping<T>) => {
    if (typeof rules !== 'object') throw new Error('The rules function takes an rule object as an argument.');
    return { check: check(conf, rules) };
  };

export const config = (conf: Config = {}) => ({ rules: rules(conf) });
