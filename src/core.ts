import './extensions/array';
import './extensions/set';

type ObjData = { [key in string]: Data };
type Data = boolean | number | bigint | string | Data[] | ObjData;
const ruleTypes = ['boolean', 'number', 'bigint', 'string', 'array', 'object'] as const;
type RuleType = typeof ruleTypes[number];

type ErrorCode<T> = T & { [key in `${keyof T}ErrorCode`]?: string };
type AND<T> = { and?: Conditional<T>[] } & { or?: undefined };
type OR<T> = { or?: Conditional<T>[] } & { and?: undefined };
type Conditional<T> = (T & { and?: undefined; or?: undefined }) | AND<T> | OR<T>;
type EqualOrNotEqualRules<T extends boolean | number | bigint | string> = ErrorCode<{ eq?: T; ne?: T }>;
type LimitationRules<T extends number | bigint | string> = EqualOrNotEqualRules<T> &
  ErrorCode<{
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
    notPattern?: RegExp;
  }>;
export type StringRules = StringBaseRules &
  ErrorCode<{
    asBoolean?: BooleanRules;
    asNumber?: NumberRules;
    asBigInt?: BigIntRules;
  }> & { length?: LimitationRules<number> };
type StringRuleDef = Rule<'string', Conditional<StringRules>>;

type Element<T, S> = T extends (infer E)[] ? (E extends S ? E : never) : never;
type ElementRule<T> = RuleDef<Element<T, Data>>;
type ArrayMetaRules = NumberRules;
type ArrayRules<T extends Data[]> = Conditional<ArrayMetaRules> & { elements: ElementRule<T> };
type ArrayRuleDef<T extends Data[]> = Rule<'array', ArrayRules<T>>;

export type RuleMapping<T extends ObjData> = { [key in keyof T]-?: RuleDef<T[key]> };
type ObjectMetaRules = ErrorCode<{ disallowUndefinedKeys?: boolean }>;
type ObjectRuleDef<T extends ObjData> = Rule<'object', ObjectMetaRules & { keys: RuleMapping<T> }>;

export type RuleDef<T extends Data = Data> = T extends boolean
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

export type ErrorResult = { path: (string | number)[]; value: unknown; label?: string; code: string };

export type CheckArgs<R, V> = {
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

const getType = (value: unknown): TypeOf => {
  if (value === null) return 'null';
  var deepType: DeepType = Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
  if (/^(array|bigint|date|error|function|generatorfunction|generator|regexp|symbol)$/.test(deepType)) return deepType;
  if (typeof value === 'object' || typeof value === 'function') return 'object';
  return typeof value;
};

const getTypeFromParent = (obj: unknown, key: string): TypeOf => {
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

const checkConditionalRules = <T, V = unknown>(
  args: CheckArgs<Conditional<T>, V>,
  checker: (args: CheckArgs<T, V>) => ErrorResult[]
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
  return checker({ ...args, rule });
};

const checkEqualOrNotEqual = <T extends boolean | number | bigint | string>(
  args: CheckArgs<EqualOrNotEqualRules<T>, T>
): ErrorResult[] => {
  const { rule, value, path, label } = args;
  const errors: ErrorResult[] = [];
  // eq?: T;
  if (rule.eq !== undefined && !(rule.eq === value)) {
    const code = rule.eqErrorCode ?? 'eq';
    errors.push({ code, value, path, label });
  }
  // ne?: T;
  if (rule.ne !== undefined && !(rule.ne !== value)) {
    const code = rule.neErrorCode ?? 'ne';
    errors.push({ code, value, path, label });
  }
  return errors;
};

const checkLimitations = <T extends number | bigint | string>(
  args: CheckArgs<LimitationRules<T>, T>
): ErrorResult[] => {
  // eq?: T; ne?: T;
  const errors: ErrorResult[] = checkEqualOrNotEqual(args);

  const { rule, value, path, label } = args;
  if (rule.ge !== undefined && !(rule.ge <= value)) {
    const code = rule.geErrorCode ?? 'ge';
    errors.push({ code, value, path, label });
  }
  if (rule.gt !== undefined && !(rule.gt < value)) {
    const code = rule.gtErrorCode ?? 'gt';
    errors.push({ code, value, path, label });
  }
  if (rule.le !== undefined && !(rule.le >= value)) {
    const code = rule.leErrorCode ?? 'le';
    errors.push({ code, value, path, label });
  }
  if (rule.lt !== undefined && !(rule.lt > value)) {
    const code = rule.ltErrorCode ?? 'lt';
    errors.push({ code, value, path, label });
  }
  if (rule.between !== undefined && !(rule.between[0] < value && value < rule.between[1])) {
    const code = rule.betweenErrorCode ?? 'between';
    errors.push({ code, value, path, label });
  }
  if (rule.oneOf !== undefined && !rule.oneOf.includes(value)) {
    const code = rule.oneOfErrorCode ?? 'oneOf';
    errors.push({ code, value, path, label });
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

const checkBoolean = (args: CheckArgs<RuleDef<boolean>, boolean>): ErrorResult[] => checkEqualOrNotEqual(args);

const checkNumber = (args: CheckArgs<RuleDef<number>, number>): ErrorResult[] => {
  return checkConditionalRules(args, checkLimitations);
};

const checkBigInt = (args: CheckArgs<RuleDef<bigint>, bigint>): ErrorResult[] => {
  return checkConditionalRules(args, checkLimitations);
};

const checkStringBaseRules = (args: CheckArgs<StringBaseRules, string>): ErrorResult[] => {
  const errors = checkLimitations(args);

  const { rule, value, path, label } = args;
  // beginsWith?: string;
  if (rule.beginsWith !== undefined && !value.startsWith(rule.beginsWith)) {
    const code = rule.beginsWithErrorCode ?? 'beginsWith';
    errors.push({ code, value, path, label });
  }
  // contains?: string;
  if (rule.contains !== undefined && !value.includes(rule.contains)) {
    const code = rule.containsErrorCode ?? 'contains';
    errors.push({ code, value, path, label });
  }
  // notContains?: string;
  if (rule.notContains !== undefined && value.includes(rule.notContains)) {
    const code = rule.notContains ?? 'notContains';
    errors.push({ code, value, path, label });
  }
  // pattern?: RegExp;
  if (rule.pattern !== undefined && !rule.pattern.test(value)) {
    const code = rule.patternErrorCode ?? 'patternErrorCode';
    errors.push({ code, value, path, label });
  }
  // notPattern?: RegExp;
  if (rule.notPattern !== undefined && rule.notPattern.test(value)) {
    const code = rule.notPatternErrorCode ?? 'notPattern';
    errors.push({ code, value, path, label });
  }
  return errors;
};

const checkStringAsBoolean = (args: CheckArgs<StringRules, string>): ErrorResult[] => {
  if (args.rule.asBoolean === undefined) return [];
  const { rule, value, path, label } = args;
  const lower = value.toLowerCase();
  const trueValues = ['y', 'yes', 't', 'true', 'on', '1'];
  const falseValues = ['n', 'no', 'f', 'false', 'off', '0'];
  const valueAsBoolean = trueValues.includes(lower) ? true : falseValues.includes(lower) ? false : undefined;
  if (valueAsBoolean === undefined) {
    const code = rule.asBooleanErrorCode ?? 'asBoolean';
    return [{ code, value, path, label }];
  }
  return checkBoolean({ ...args, rule: { type: 'boolean', ...rule.asBoolean }, value: valueAsBoolean });
};

const checkStringAsNumber = (args: CheckArgs<StringRules, string>): ErrorResult[] => {
  if (args.rule.asNumber === undefined) return [];
  const { rule, value, path, label } = args;
  const valueAsNumber = Number(value);
  if (isNaN(valueAsNumber)) {
    const code = rule.asNumberErrorCode ?? 'asNumber';
    return [{ code, value, path, label }];
  }
  return checkNumber({ ...args, rule: { type: 'number', ...rule.asNumber }, value: valueAsNumber });
};
const createBigIntSafely = (value: string | number | bigint | boolean): bigint | undefined =>
  !isNaN(Number(value)) ? BigInt(value) : undefined;

const checkStringAsBigInt = (args: CheckArgs<StringRules, string>): ErrorResult[] => {
  if (args.rule.asBigInt === undefined) return [];
  const { rule, value, path, label } = args;
  const valueAsBigInt = createBigIntSafely(value);
  if (valueAsBigInt === undefined) {
    const code = rule.asNumberErrorCode ?? 'asBigInt';
    return [{ code, value, path, label }];
  }
  return checkBigInt({ ...args, rule: { type: 'bigint', ...rule.asNumber }, value: valueAsBigInt });
};

const checkStringLength = (args: CheckArgs<StringRules, string>): ErrorResult[] => {
  if (args.rule.length === undefined) return [];
  const { rule, value } = args;
  return checkLimitations({ ...args, rule: rule.length, value: value.length });
};

const checkStringRules = (args: CheckArgs<StringRules, string>): ErrorResult[] => {
  return [
    checkStringBaseRules(args),
    checkStringAsNumber(args),
    checkStringAsBigInt(args),
    checkStringLength(args),
  ].flatMap((errors) => errors);
};

const checkString = (args: CheckArgs<RuleDef<string>, string>): ErrorResult[] => {
  return checkConditionalRules(args, checkStringRules);
};

const checkArrayMetaRules = (args: CheckArgs<ArrayMetaRules, Data[]>): ErrorResult[] => {
  return checkLimitations({ ...args, rule: args.rule, value: args.value.length });
};

const checkArray = <T extends Data[]>(args: CheckArgs<RuleDef<T>, T>): ErrorResult[] => {
  const errors = checkConditionalRules(args, checkArrayMetaRules);
  const rule = args.rule.elements;
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
  });
  return errors.concat(childrenErrors);
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

export const functions = {
  getType,
  getTypeFromParent,
  checkStringAsBoolean,
  checkStringAsNumber,
  createBigIntSafely,
};

export default { rules };
