import './extensions/array';
import './extensions/set';

type ObjData = { [key in string]: Data };
type Data = boolean | number | bigint | string | Data[] | ObjData;
const ruleTypes = ['boolean', 'number', 'bigint', 'string', 'array', 'object'] as const;
type RuleType = typeof ruleTypes[number];

type ErrorCode<T> = T & { [key in `${keyof T}ErrorCode`]?: string };
type AND<T> = { and: Conditional<T>[] };
type OR<T> = { or: Conditional<T>[] };
type Conditional<T> = T | AND<T> | OR<T>;
type LimitationType = number | bigint | string;
const limitationRuleTypes = ['number', 'bigint', 'string'] as const;
type LimitationRuleType = typeof limitationRuleTypes[number];
type LimitationRules<T extends LimitationType> = ErrorCode<{
  eq?: T;
  ne?: T;
  ge?: T;
  gt?: T;
  le?: T;
  lt?: T;
  between?: [T, T];
  oneOf?: T[];
}>;

type NullableRules = ErrorCode<{
  required?: boolean;
  disallowUndefined?: boolean;
  disallowNull?: boolean;
  disallowNokey?: boolean;
}>;
type Rule<T extends RuleType, S> = { type: T; typeErrorCode?: string; label?: string } & NullableRules & S;

type BooleanRules = ErrorCode<{ ne?: boolean; eq?: boolean }>;
type BooleanRuleDef = Rule<'boolean', BooleanRules>;

type NumberRules = LimitationRules<number>;
type NumberRuleDef = Rule<'number', Conditional<NumberRules>>;

type BigIntRules = LimitationRules<bigint>;
type BigIntRuleDef = Rule<'bigint', Conditional<BigIntRules>>;

type StringBaseRules = LimitationRules<string> &
  ErrorCode<{
    beginsWith?: string;
    contains?: string;
    notContains?: string;
    pattern?: RegExp;
    ngPattern?: RegExp;
    length?: LimitationRules<number>;
  }>;
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

type ErrorResult = { path: (string | number)[]; value: unknown; label?: string; code: string };

type CheckArgs<R, V> = {
  rule: R;
  value: V;
  path: (string | number)[];
  label?: string;
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

const isBoolean = (value: unknown): value is boolean => getType(value) === 'boolean';
const isNumber = (value: unknown): value is number => getType(value) === 'number';
const isBigint = (value: unknown): value is bigint => getType(value) === 'bigint';
const isString = (value: unknown): value is string => getType(value) === 'string';
const isArray = (value: unknown): value is Data[] => getType(value) === 'array';
const isObject = (value: unknown): value is ObjData => getType(value) === 'object';
const isNullable = (type: TypeOf): type is NullableType => (nullableTypes as unknown as TypeOf).includes(type);
const isAND = <T>(rule: Conditional<T>): rule is AND<T> => getType((rule as any).and) === 'array';
const isOR = <T>(rule: Conditional<T>): rule is OR<T> => getType((rule as any).or) === 'array';

const checkConditionalRules = <T>(
  args: CheckArgs<Conditional<T>, unknown>,
  checker: (args: CheckArgs<T, unknown>) => ErrorResult[]
): ErrorResult[] => {
  const { rule } = args;
  if (isAND(rule)) {
    return rule.and.flatMap((r) => checkConditionalRules({ ...args, rule: r }, checker));
  }
  if (isOR(rule)) {
    const results = rule.or.map((r) => checkConditionalRules({ ...args, rule: r }, checker));
    if (results.some((result) => result.length === 0)) return [];
    return results.flatMap((errors) => errors);
  }
  return checker({...args, rule});
};

const checkLength = <T extends LimitationType>(args: CheckArgs<LimitationRules<T>, T>): ErrorResult[] => {
  const { rule, value, path } = args;
  const errors: ErrorResult[] = [];
  // eq?: T;
  if (rule.eq !== undefined && !(rule.eq === value)) {
    const code = rule.eqErrorCode ?? 'eq';
    errors.push({ code, value, path });
  }
  // ne?: T;
  if (rule.ne !== undefined && !(rule.ne !== value)) {
    const code = rule.neErrorCode ?? 'ne';
    errors.push({ code, value, path });
  }
  // ge?: T;
  if (rule.ge !== undefined && !(rule.ge <= value)) {
    const code = rule.geErrorCode ?? 'ge';
    errors.push({ code, value, path });
  }
  // gt?: T;
  if (rule.gt !== undefined && !(rule.gt < value)) {
    const code = rule.gtErrorCode ?? 'gt';
    errors.push({ code, value, path });
  }
  // le?: T;
  if (rule.le !== undefined && !(rule.le >= value)) {
    const code = rule.leErrorCode ?? 'le';
    errors.push({ code, value, path });
  }
  // lt?: T;
  if (rule.lt !== undefined && !(rule.lt > value)) {
    const code = rule.ltErrorCode ?? 'lt';
    errors.push({ code, value, path });
  }
  // between?: [T, T];
  if (rule.between !== undefined && !(rule.between[0] < value && value < rule.between[1])) {
    const code = rule.betweenErrorCode ?? 'between';
    errors.push({ code, value, path });
  }
  // oneOf?: T[];
  if (rule.oneOf !== undefined && !rule.oneOf.set().has(value)) {
    const code = rule.oneOfErrorCode ?? 'oneOf';
    errors.push({ code, value, path });
  }
  return errors;
};

const checkRequiredRule = (type: TypeOf, { rule, value, path }: CheckArgs<RuleDef, unknown>): ErrorResult[] => {
  const required: boolean = rule.required ?? false;
  if (!required) return [];
  if (!(nullableTypes as unknown as TypeOf).includes(type)) return [];
  const code = rule.requiredErrorCode ?? 'required';
  const { label } = rule;
  return [{ code, value, path, label }];
};

const checkNullableDisallowRule = (type: TypeOf, args: CheckArgs<RuleDef, unknown>): ErrorResult[] => {
  const { rule, value, path } = args;
  if (!isNullable(type)) return [];
  switch (type) {
    case 'undefined': {
      const disallowUndefined = rule.disallowUndefined;
      if (!disallowUndefined) return [];
      const code = rule.disallowUndefinedErrorCode ?? 'disallowUndefined';
      const { label } = rule;
      return [{ code, value, path, label }];
    }
    case 'null': {
      const disallowNull = rule.disallowNull;
      if (!disallowNull) return [];
      const code = rule.disallowNokeyErrorCode ?? 'disallowNull';
      const { label } = rule;
      return [{ code, value, path, label }];
    }
    case 'nokey': {
      const disallowNokey = rule.disallowNokey;
      if (!disallowNokey) return [];
      const code = rule.disallowNokeyErrorCode ?? 'disallowNokey';
      const { label } = rule;
      return [{ code, value, path, label }];
    }
  }
};

const checkNullableRules = (type: TypeOf, args: CheckArgs<RuleDef, unknown>): ErrorResult[] => {
  const requiredErrors = checkRequiredRule(type, args);
  if (requiredErrors.length !== 0) return requiredErrors;
  const disallowErrors = checkNullableDisallowRule(type, args);
  return disallowErrors;
};

const checkType = (type: TypeOf, { rule, value, path }: CheckArgs<RuleDef, unknown>): ErrorResult[] => {
  if (rule.type === type) return [];
  const code = rule.typeErrorCode ?? 'type';
  const { label } = rule;
  return [{ code, value, path, label }];
};

const checkBoolean = ({ rule, value, path }: CheckArgs<RuleDef<boolean>, boolean>): ErrorResult[] => {
  return [];
};

const checkNumber = ({ rule, value, path }: CheckArgs<RuleDef<number>, number>): ErrorResult[] => {
  return [];
};
const checkBigInt = ({ rule, value, path }: CheckArgs<RuleDef<bigint>, bigint>): ErrorResult[] => {
  return [];
};
const checkString = ({ rule, value, path }: CheckArgs<RuleDef<string>, string>): ErrorResult[] => {
  return [];
};

const checkArrayMetaRules = (args: CheckArgs<ArrayMetaRules, number>): ErrorResult[] => {
  if (args.rule.length === undefined) return [];
  return checkLength({ ...args, rule: args.rule.length });
};

const checkArray = <T extends Data[]>(args: CheckArgs<RuleDef<T>, T>): ErrorResult[] => {
  const errors = checkConditionalRules(args, checkArrayMetaRules);
  const rule = args.rule.elements
  const childrenErrors = args.value.flatMap((value, index) => {
    const type = getType(value);
    const path = args.path.concat([index]);
    const requiredErrors = checkNullableRules(type, { rule, value, path });
    if (requiredErrors.length !== 0) return requiredErrors;

    const typeErrors = checkType(type, { rule, value, path });
    if (typeErrors.length !== 0) return typeErrors;

    if (rule.type === 'boolean' && isBoolean(value)) return checkBoolean({ rule, value, path });
    if (rule.type === 'number' && isNumber(value)) return checkNumber({ rule, value, path });
    if (rule.type === 'bigint' && isBigint(value)) return checkBigInt({ rule, value, path });
    if (rule.type === 'string' && isString(value)) return checkString({ rule, value, path });
    if (rule.type === 'array' && isArray(value)) return checkArray({ rule, value, path });
    if (rule.type === 'object' && isObject(value)) return checkObject({ rule, value, path });
    throw new Error();
  })
  return errors.concat(childrenErrors)
};

const objectKeys = <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[];

const checkObjectDisallowUndefinedKeys = (args: CheckArgs<RuleDef<ObjData>, object>): ErrorResult[] => {
  const { rule, value, path } = args;
  const disallowUndefinedKeys: boolean = rule.disallowUndefinedKeys ?? false;
  if (!disallowUndefinedKeys) return [];
  const ruleKeySet = objectKeys(rule.keys).set();
  const dataKeySet = objectKeys(value).set();
  if (ruleKeySet.equals(dataKeySet)) return [];
  const code = rule.disallowUndefinedKeysErrorCode ?? 'disallowUndefinedKeys';
  const { label } = rule;
  return [{ code, value, path, label }];
};

const checkObject = (args: CheckArgs<RuleDef<ObjData>, object>): ErrorResult[] => {

  const errors: ErrorResult[] = [checkObjectDisallowUndefinedKeys(args)].flatMap((error) => error);

  const childrenErrors = objectKeys(args.rule.keys).flatMap((key) => {
    const rule = args.rule.keys[key];
    const value = args.value[key];
    const type = getTypeFromParent(args.value, key);
    const path = args.path.concat([key]);

    const requiredErrors = checkNullableRules(type, { rule, value, path });
    if (requiredErrors.length !== 0) return requiredErrors;

    const typeErrors = checkType(type, { rule, value, path });
    if (typeErrors.length !== 0) return typeErrors;

    if (rule.type === 'boolean' && isBoolean(value)) return checkBoolean({ rule, value, path });
    if (rule.type === 'number' && isNumber(value)) return checkNumber({ rule, value, path });
    if (rule.type === 'bigint' && isBigint(value)) return checkBigInt({ rule, value, path });
    if (rule.type === 'string' && isString(value)) return checkString({ rule, value, path });
    if (rule.type === 'array' && isArray(value)) return checkArray({ rule, value, path });
    if (rule.type === 'object' && isObject(value)) return checkObject({ rule, value, path });
    throw new Error();
  });
  return errors.concat(childrenErrors);
};

const check =
  <T extends ObjData>(rules: RuleMapping<T>) =>
  (value: ObjData): ErrorResult[] => {
    if (typeof value !== 'object') throw new Error('The check function takes an object as an argument.');
    const rule: ObjectRuleDef<T> = { type: 'object', keys: rules };
    return checkObject({ rule, value, path: [] });
  };

export const rules = <T extends ObjData>(rules: RuleMapping<T>) => {
  if (typeof rules !== 'object') throw new Error('The rules function takes an rule object as an argument.');
  return { check: check(rules) };
};
