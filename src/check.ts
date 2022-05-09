import SetEx from './extensions/set';
import {
  Check,
  CheckArray,
  CheckBase,
  CheckBigInt,
  CheckBoolean,
  CheckConditionalRules,
  CheckEqNe,
  CheckLimit,
  CheckNumber,
  CheckObject,
  CheckString,
  CheckStringBaseRules,
  CheckStringRules,
  CreateErrorResult,
  ErrorResult,
} from './types/check';
import { AND, Conditional, OR } from './types/rule-def';
import { NullableType, TypeOf, nullableTypes } from './types/type-of';
import { getType, getTypeFromParent, objectKeys } from './util';

const isAND = <T>(rule: Conditional<T>): rule is AND<T> => getType((rule as any)?.and) === 'array';
const isOR = <T>(rule: Conditional<T>): rule is OR<T> => getType((rule as any)?.or) === 'array';

const createErrorResult: CreateErrorResult = (rule, arg) => ({
  rule: { name: rule, value: arg.rule[rule] },
  value: arg.value,
  code: arg.rule[`${rule}ErrorCode`] ?? rule,
  path: arg.path,
  label: arg.label,
});

const checkConditionalRules: CheckConditionalRules = (arg, checker) => {
  const { rule } = arg;
  if (!rule) return [];

  if (isAND(rule)) {
    return rule.and.flatMap((r) => checkConditionalRules({ ...arg, rule: r }, checker));
  }
  if (isOR(rule)) {
    const results = rule.or.map((r) => checkConditionalRules({ ...arg, rule: r }, checker));
    if (results.some((result) => result.length === 0)) return [];
    return results.flatMap((errors) => errors);
  }
  return checker({ ...arg, rule });
};

const checkEq: CheckEqNe = (arg) => {
  const { rule, value } = arg;
  if (rule.eq === undefined) return [];
  return rule.eq === value ? [] : [createErrorResult('eq', arg)];
};

const checkNe: CheckEqNe = (arg) => {
  const { rule, value } = arg;
  if (rule.ne === undefined) return [];
  return rule.ne !== value ? [] : [createErrorResult('ne', arg)];
};

const checkEqNe: CheckEqNe = (arg) => [checkEq(arg), checkNe(arg)].flatMap((errors) => errors);

const checkGe: CheckLimit = (arg) => {
  const { rule, value } = arg;
  if (rule.ge === undefined) return [];
  return rule.ge <= value ? [] : [createErrorResult('ge', arg)];
};

const checkGt: CheckLimit = (arg) => {
  const { rule, value } = arg;
  if (rule.gt === undefined) return [];
  return rule.gt < value ? [] : [createErrorResult('gt', arg)];
};

const checkLe: CheckLimit = (arg) => {
  const { rule, value } = arg;
  if (rule.le === undefined) return [];
  return rule.le >= value ? [] : [createErrorResult('le', arg)];
};

const checkLt: CheckLimit = (arg) => {
  const { rule, value } = arg;
  if (rule.lt === undefined) return [];
  return rule.lt > value ? [] : [createErrorResult('lt', arg)];
};

const checkBetween: CheckLimit = (arg) => {
  const { rule, value } = arg;
  if (rule.between === undefined) return [];
  return rule.between[0] < value && value < rule.between[1]
    ? []
    : [createErrorResult('between', arg)];
};

const checkOneOf: CheckLimit = (arg) => {
  const { rule, value } = arg;
  if (rule.oneOf === undefined) return [];
  return rule.oneOf.includes(value as any) ? [] : [createErrorResult('oneOf', arg)];
};

const checkLimit: CheckLimit = (arg) =>
  [
    checkEqNe(arg),
    checkGe(arg),
    checkGt(arg),
    checkLe(arg),
    checkLt(arg),
    checkBetween(arg),
    checkOneOf(arg),
  ].flatMap((errors) => errors);

const isNullable = (type: TypeOf): type is NullableType =>
  (nullableTypes as unknown as TypeOf).includes(type);

const checkRequiredRule: CheckBase = (arg) => {
  const { rule, type } = arg;
  if (!rule.required) return [];
  return isNullable(type) ? [createErrorResult('required', arg)] : [];
};

const checkNullableDisallowRule: CheckBase = (arg) => {
  const { rule, type } = arg;
  if (!isNullable(type)) return [];
  if (type === 'undefined') {
    if (!rule.disallowUndefined) return [];
    return [createErrorResult('disallowUndefined', arg)];
  }
  if (type === 'null') {
    if (!rule.disallowNull) return [];
    return [createErrorResult('disallowNull', arg)];
  }
  if (type === 'nokey') {
    if (!rule.disallowNokey) return [];
    return [createErrorResult('disallowNokey', arg)];
  }
  throw new Error();
};

const checkExistenceRules: CheckBase = (arg) => {
  const requiredErrors = checkRequiredRule(arg);
  if (requiredErrors.length !== 0) return requiredErrors;
  return checkNullableDisallowRule(arg);
};

const checkType: CheckBase = (arg) => {
  const { rule, type } = arg;
  if (isNullable(type) || rule.type === type) return [];
  return [createErrorResult('type', arg)];
};

const checkBoolean: CheckBoolean = (arg) => checkEqNe(arg);

const checkNumber: CheckNumber = (arg) => checkConditionalRules(arg, checkLimit);

const checkBigInt: CheckBigInt = (arg) => checkConditionalRules(arg, checkLimit);

const checkBeginsWith: CheckStringBaseRules = (arg) => {
  const { rule, value } = arg;
  if (rule.beginsWith === undefined) return [];
  return value.startsWith(rule.beginsWith) ? [] : [createErrorResult('beginsWith', arg)];
};

const checkContains: CheckStringBaseRules = (arg) => {
  const { rule, value } = arg;
  if (rule.contains === undefined) return [];
  return value.includes(rule.contains) ? [] : [createErrorResult('contains', arg)];
};

const checkNotContains: CheckStringBaseRules = (arg) => {
  const { rule, value } = arg;
  if (rule.notContains === undefined) return [];
  return !value.includes(rule.notContains) ? [] : [createErrorResult('notContains', arg)];
};

const checkPattern: CheckStringBaseRules = (arg) => {
  const { rule, value } = arg;
  if (rule.pattern === undefined) return [];
  return rule.pattern.test(value) ? [] : [createErrorResult('pattern', arg)];
};

const checkNotPattern: CheckStringBaseRules = (arg) => {
  const { rule, value } = arg;
  if (rule.notPattern === undefined) return [];
  return !rule.notPattern.test(value) ? [] : [createErrorResult('notPattern', arg)];
};

const checkStringBaseRules: CheckStringBaseRules = (arg) =>
  [
    checkLimit(arg),
    checkBeginsWith(arg),
    checkContains(arg),
    checkNotContains(arg),
    checkPattern(arg),
    checkNotPattern(arg),
  ].flatMap((errors) => errors);

const convertStringToBoolean = (value: string): boolean | undefined => {
  const lower = value.toLowerCase();
  const trueValues = ['y', 'yes', 't', 'true', 'on', '1'];
  const falseValues = ['n', 'no', 'f', 'false', 'off', '0'];
  if (trueValues.includes(lower)) return true;
  if (falseValues.includes(lower)) return false;
  return undefined;
};

const checkStringAsBoolean: CheckStringRules = (arg) => {
  if (arg.rule.asBoolean === undefined) return [];
  const { rule, value } = arg;
  const valueAsBoolean = convertStringToBoolean(value);
  if (valueAsBoolean === undefined) return [createErrorResult('asBoolean', arg)];
  return checkBoolean({
    ...arg,
    rule: { type: 'boolean', ...rule.asBoolean },
    value: valueAsBoolean,
  });
};

export const checkStringAsNumber: CheckStringRules = (arg) => {
  if (arg.rule.asNumber === undefined) return [];
  const { rule, value } = arg;
  const valueAsNumber = Number(value);
  if (Number.isNaN(valueAsNumber)) return [createErrorResult('asNumber', arg)];
  return checkNumber({ ...arg, rule: { type: 'number', ...rule.asNumber }, value: valueAsNumber });
};

export const createBigIntSafely = (value: string | number | bigint | boolean): bigint | undefined =>
  !Number.isNaN(Number(value)) ? BigInt(value) : undefined;

const checkStringAsBigInt: CheckStringRules = (arg) => {
  if (arg.rule.asBigInt === undefined) return [];
  const { rule, value } = arg;
  const valueAsBigInt = createBigIntSafely(value);
  if (valueAsBigInt === undefined) return [createErrorResult('asBigInt', arg)];
  return checkBigInt({ ...arg, rule: { type: 'bigint', ...rule.asNumber }, value: valueAsBigInt });
};

const checkStringLength: CheckStringRules = (arg) => {
  if (arg.rule.length === undefined) return [];
  const { rule, value } = arg;
  return checkLimit({ ...arg, rule: rule.length, value: value.length });
};

const checkStringRules: CheckStringRules = (arg) =>
  [
    checkStringBaseRules(arg),
    checkStringAsBoolean(arg),
    checkStringAsNumber(arg),
    checkStringAsBigInt(arg),
    checkStringLength(arg),
  ].flatMap((errors) => errors);

const checkString: CheckString = (arg) => checkConditionalRules(arg, checkStringRules);

const checkArrayMetaRules: CheckArray = (arg) => {
  const { label } = arg;
  const rule = arg.rule.length;
  const value = (arg.value as []).length;
  const path = arg.path.concat('length');
  const lengthArgs = { type: 'number', rule, value, path, label } as const;
  return checkConditionalRules(lengthArgs, checkLimit);
};

const checkArray: CheckArray = (arg) => {
  const errors = checkArrayMetaRules(arg);

  const childrenErrors = (arg.value as []).flatMap((value, index) => {
    const rule = arg.rule.elements;
    const type = getType(value);
    const path = arg.path.concat([index]);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return check({ rule, type, value, path });
  });
  return errors.concat(childrenErrors);
};

const checkObjectDisallowUndefinedKeys: CheckObject = (arg) => {
  const { rule, value } = arg;
  const disallowUndefinedKeys: boolean = rule.disallowUndefinedKeys ?? false;
  if (!disallowUndefinedKeys) return [];
  const ruleKeySet = new SetEx(objectKeys(rule.keys));
  const dataKeySet = new SetEx(objectKeys(value as object));
  if (ruleKeySet.isSuperset(dataKeySet)) return [];
  return [createErrorResult('disallowUndefinedKeys', arg)];
};

const checkObject: CheckObject = (arg) => {
  const errors: ErrorResult[] = [checkObjectDisallowUndefinedKeys(arg)].flatMap((error) => error);

  const childrenErrors = objectKeys(arg.rule.keys).flatMap((key) => {
    const rule = arg.rule.keys[key];
    const value = arg.value[key];
    const type = getTypeFromParent(arg.value, key);
    const path = arg.path.concat([key]);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return check({ rule, type, value, path });
  });
  return errors.concat(childrenErrors);
};

export const check: Check = (arg) => {
  const { rule, value } = arg;
  if (rule.type === 'ignore') return [];

  const requiredErrors = checkExistenceRules({ ...arg, rule });
  if (requiredErrors.length !== 0) return requiredErrors;

  const typeErrors = checkType({ ...arg, rule });
  if (typeErrors.length !== 0) return typeErrors;

  if (rule.type === 'boolean') return checkBoolean({ ...arg, rule, value });
  if (rule.type === 'number') return checkNumber({ ...arg, rule, value });
  if (rule.type === 'bigint') return checkBigInt({ ...arg, rule, value });
  if (rule.type === 'string') return checkString({ ...arg, rule, value });
  if (rule.type === 'array') return checkArray({ ...arg, rule, value });
  if (rule.type === 'object') return checkObject({ ...arg, rule, value });
  throw new Error();
};
