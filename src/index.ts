import './extensions/array';
import './extensions/set';

export type ObjData = { [key in string]?: Data };
export type Data = null | undefined | boolean | number | bigint | string | Data[] | ObjData;

export type ArrayPath<T extends Data[]> =
  | [number] //
  | T extends (infer E)[]
  ? E extends Data[]
    ? [number] | [number, ...ArrayPath<E>]
    : E extends ObjData
    ? [number] | [number, ...ObjectPath<E>]
    : never
  : never;

export type ObjectValue<T extends object> = T[keyof T];

export type ObjectPath<T extends ObjData> = ObjectValue<{
  [key in keyof T]:
    | [key] //
    | (T[key] extends ObjData ? [key, ...ObjectPath<T[key]>] : never)
    | (T[key] extends Data[] ? [key, ...ArrayPath<T[key]>] : never);
}>;

const ruleTypes = ['boolean', 'number', 'bigint', 'string', 'array', 'object', 'ignore'] as const;
export type RuleType = typeof ruleTypes[number];
export type ErrorCode<T> = T & { [key in `${keyof T}ErrorCode`]?: string };
export type AND<T> = { and?: Conditional<T>[] } & { or?: undefined };
export type OR<T> = { or?: Conditional<T>[] } & { and?: undefined };
export type Conditional<T> = (T & { and?: undefined; or?: undefined }) | AND<T> | OR<T>;
export type EqualOrNotEqualRules<T extends boolean | number | bigint | string> = ErrorCode<{ eq?: T; ne?: T }>;
export type LimitationRules<T extends number | bigint | string> = EqualOrNotEqualRules<T> &
  ErrorCode<{
    ge?: T;
    gt?: T;
    le?: T;
    lt?: T;
    between?: [T, T];
    oneOf?: T[];
  }>;

export type ExistenceRules = ErrorCode<{
  required?: boolean;
  disallowUndefined?: boolean;
  disallowNull?: boolean;
  disallowNokey?: boolean;
}>;
export type Rule<T extends RuleType, S> = { type: T; typeErrorCode?: string; label?: string } & ExistenceRules & S;

export type BooleanRules = ErrorCode<{ ne?: boolean; eq?: boolean }>;
export type BooleanRuleDef = Rule<'boolean', BooleanRules>;

export type NumberRules = LimitationRules<number>;
export type NumberRuleDef = Rule<'number', Conditional<NumberRules>>;

export type BigIntRules = LimitationRules<bigint>;
export type BigIntRuleDef = Rule<'bigint', Conditional<BigIntRules>>;

export type StringBaseRules = LimitationRules<string> &
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
export type StringRuleDef = Rule<'string', Conditional<StringRules>>;

export type ArrayElement<T, S> = T extends (infer E)[] ? (E extends S ? E : never) : never;
export type ElementRule<T> = RuleDef<ArrayElement<T, Data>>;
export type ArrayMetaRules = { length?: Conditional<NumberRules> };
export type ArrayRules<T extends Data[]> = ArrayMetaRules & { elements: ElementRule<T> };
export type ArrayRuleDef<T extends Data[]> = Rule<'array', ArrayRules<T>>;

export type RuleMapping<T extends ObjData> = { [key in keyof T]-?: RuleDef<T[key]> };
export type ObjectMetaRules = ErrorCode<{ disallowUndefinedKeys?: boolean }>;
export type ObjectRuleDef<T extends ObjData> = Rule<'object', ObjectMetaRules & { keys: RuleMapping<T> }>;

export type IgnoreRuleDef = Rule<'ignore', any>;

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
  : IgnoreRuleDef;

export type DefaultRules = {
  existence?: ExistenceRules;
  array?: ArrayMetaRules;
  object?: ObjectMetaRules;
};

export type ErrorResult = { path: (string | number)[]; value: unknown; label?: string; code: string };

export type CheckArgs<R, V> = {
  rule: R;
  type: TypeOf;
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
export type DeepType = typeof deepTypes[number];
const typeOf = (value: unknown) => typeof value;
export type TypeOf = ReturnType<typeof typeOf> | DeepType | 'null' | 'nokey';
const nullableTypes = ['undefined', 'null', 'nokey'] as const;
export type NullableType = typeof nullableTypes[number];

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

const checkRequiredRule = ({ rule, type, value, path }: CheckArgs<RuleDef, unknown>): ErrorResult[] => {
  const required: boolean = rule.required ?? false;
  if (!required) return [];
  if (!(nullableTypes as unknown as TypeOf).includes(type)) return [];
  const code = rule.requiredErrorCode ?? 'required';
  const { label } = rule;
  return [{ code, value, path, label }];
};

const checkNullableDisallowRule = ({ rule, type, value, path }: CheckArgs<RuleDef, unknown>): ErrorResult[] => {
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

const checkExistenceRules = (args: CheckArgs<RuleDef, unknown>): ErrorResult[] => {
  const requiredErrors = checkRequiredRule(args);
  if (requiredErrors.length !== 0) return requiredErrors;
  const disallowErrors = checkNullableDisallowRule(args);
  return disallowErrors;
};

const checkType = ({ rule, type, value, path }: CheckArgs<RuleDef, unknown>): ErrorResult[] => {
  if (rule.type === type) return [];
  const code = rule.typeErrorCode ?? 'type';
  const { label } = rule;
  return [{ code, value, path, label }];
};

const check = <T>(args: CheckArgs<RuleDef<T>, T>): ErrorResult[] => {
  const { rule, value } = args;

  const requiredErrors = checkExistenceRules(args);
  if (requiredErrors.length !== 0) return requiredErrors;

  const typeErrors = checkType(args);
  if (typeErrors.length !== 0) return typeErrors;

  if (rule.type === 'boolean' && isBoolean(value)) return checkBoolean({ ...args, rule, value });
  if (rule.type === 'number' && isNumber(value)) return checkNumber({ ...args, rule, value });
  if (rule.type === 'bigint' && isBigint(value)) return checkBigInt({ ...args, rule, value });
  if (rule.type === 'string' && isString(value)) return checkString({ ...args, rule, value });
  if (rule.type === 'array' && isArray(value)) return checkArray({ ...args, rule, value });
  if (rule.type === 'object' && isObject(value)) return checkObject({ ...args, rule, value });
  throw new Error();
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

const checkArrayMetaRules = (args: CheckArgs<NumberRules, Data[]>): ErrorResult[] => {
  return checkLimitations({ ...args, rule: args.rule, value: args.value.length });
};

const checkArray = <T extends Data[]>(args: CheckArgs<RuleDef<T>, T>): ErrorResult[] => {
  const errors = checkConditionalRules({ ...args, rule: args.rule.length }, checkArrayMetaRules);

  const childrenErrors = args.value.flatMap((value, index) => {
    return check({ rule: args.rule.elements, type: getType(value), value, path: args.path.concat([index]) });
  });

  return errors.concat(childrenErrors);
};

const objectKeys = <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[];

const checkObjectDisallowUndefinedKeys = (args: CheckArgs<RuleDef<ObjData>, ObjData>): ErrorResult[] => {
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

const checkObject = (args: CheckArgs<RuleDef<ObjData>, ObjData>): ErrorResult[] => {
  const errors: ErrorResult[] = [checkObjectDisallowUndefinedKeys(args)].flatMap((error) => error);

  const childrenErrors = objectKeys(args.rule.keys).flatMap((key) => {
    const rule = args.rule.keys[key];
    const value = args.value[key];
    const type = getTypeFromParent(args.value, key);
    const path = args.path.concat([key]);
    return check({ rule, type, value, path });
  });
  return errors.concat(childrenErrors);
};

const applyDefaultRulesToRuleDef = (rule: RuleDef, conf: DefaultRules): RuleDef => {
  const result = { ...rule };
  objectKeys(conf.existence).forEach((key) => {
    if (result[key] !== undefined) (result[key] as unknown) = conf.existence[key];
  });
  switch (result.type) {
    case 'object': {
      objectKeys(conf.object).forEach((key) => {
        if (result[key] !== undefined) (result[key] as unknown) = conf.object[key];
      });
      objectKeys(result.keys).forEach((key) => {
        result.keys[key] = applyDefaultRulesToRuleDef(result.keys[key], conf);
      });
      break;
    }
    case 'array': {
      objectKeys(conf.array).forEach((key) => {
        if (result[key] !== undefined) (result[key] as unknown) = conf.array[key];
      });
      result.elements = applyDefaultRulesToRuleDef(result.elements, conf);
      break;
    }
  }
  return result;
};

const testEntry =
  <T>(rule: RuleDef<T>, path: (string | number)[] = []) =>
  (
    value: T
  ) => {
  };

testEntry<string>({ type: 'string' })('string');
testEntry<{}>({ type: 'object', keys: {} })({});

const checkEntry =
  <T>(rule: any, path: (string | number)[] = []) =>
  (
    value: T
  ): {
    isSuccess: () => boolean;
    isFailure: () => boolean;
    errors: () => ErrorResult[];
  } => {
    const errors = check({ rule, type: getType(value), value, path });
    return {
      isSuccess: () => errors.length === 0,
      isFailure: () => errors.length !== 0,
      errors: () => errors,
    };
  };

  const getTargetRule = (rule: RuleDef, path: (string | number)[]) => {
    const next = rule.type === 'array' ? rule.elements : rule.type === 'object' ? rule.keys[path[0]] : undefined;
    if (!next) throw new Error();
    if (path.length === 1) {
      return next;
    } else {
      return getTargetRule(next, path.slice(1));
    }
  };
  
  const arrayTarget =
    <T extends Data[]>(rule: RuleDef<T>) =>
    (...p: ArrayPath<T>) => {
      const path = p as (string | number)[];
      const target = getTargetRule(rule, path);
      return { check: checkEntry(target, path) };
    };
  
  const objectTarget =
    <T extends ObjData>(rule: RuleDef<T>) =>
    (...p: ObjectPath<T>) => {
      const path = p as (string | number)[];
      const target = getTargetRule(rule, path);
      return { check: checkEntry(target, path) };
    };
  


const objectSetRule = <T>(rule: any) => ({
  check: checkEntry<T>(rule),
  target: objectTarget(rule),
});

const setRule = <T>(ruleDef: RuleDef<T>, defaultRules: DefaultRules = {}) => {
  const rule = applyDefaultRulesToRuleDef(ruleDef, defaultRules);
  if (rule.type === 'object') {
    return objectSetRule<T>(rule);
  }
  return {
    check: checkEntry<T>(rule),
  };
};

const applyConfigToDefaultRules = (conf: DefaultRules, defaultRules: DefaultRules): DefaultRules => {
  const result: DefaultRules = {
    existence: {},
    object: {},
  };
  objectKeys(conf).forEach((rules) => {
    objectKeys(conf[rules]).forEach((rule) => {
      result[rules][rule] = conf[rules][rule];
    });
  });
  objectKeys(defaultRules).forEach((rules) => {
    objectKeys(defaultRules[rules]).forEach((rule) => {
      result[rules][rule] = defaultRules[rules][rule];
    });
  });
  return result;
};

const setRuleFromConfig =
  (conf: DefaultRules) =>
  <T>(ruleDef: RuleDef<T>, defaultRules: DefaultRules = {}) => {
    return setRule(ruleDef, applyConfigToDefaultRules(conf, defaultRules));
  };

const config = (conf: DefaultRules) => {
  if (typeof conf !== 'object') throw new Error('The config function takes an config object as an argument.');
  return { setRule: setRuleFromConfig(conf) };
};

export const functions = {
  getType,
  getTypeFromParent,
  checkStringAsBoolean,
  checkStringAsNumber,
  createBigIntSafely,
  setRule,
  config, 
};

export default { config, setRule };
