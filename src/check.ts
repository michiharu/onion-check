import SetEx from './extensions/set';
import {
  CheckArray,
  CheckBase,
  CheckBigInt,
  CheckBoolean,
  CheckByType,
  CheckConditionalRules,
  CheckEqNe,
  CheckNumber,
  CheckObject,
  CheckPrimitive,
  CheckString,
  CheckStringBaseRules,
  CheckStringRules,
  CreateErrorResult,
  ErrorResult,
} from './types/check';
import { AND, Conditional, OR } from './types/rule-def';
import { NullableType, TypeOf, nullableTypes } from './types/type-of';
import { getType, getTypeFromParent, objectKeys } from './util';

export const isAND = <T>(rule: Conditional<T>): rule is AND<T> => {
  const andType = getType((rule as any).and);
  if (andType === 'array') return true;
  if (andType === 'undefined') return false;
  throw new Error('"and" property must be "array" or "undefined".');
};

export const isOR = <T>(rule: Conditional<T>): rule is OR<T> => {
  const orType = getType((rule as any).or);
  if (orType === 'array') return true;
  if (orType === 'undefined') return false;
  throw new Error('"or" property must be "array" or "undefined".');
};

export const createErrorResult: CreateErrorResult = (rule, arg) => ({
  rule: { name: rule, value: arg.rule[rule] },
  value: arg.value,
  code: arg.rule[`${rule}ErrorCode`] ?? rule,
  path: arg.path,
  label: arg.label,
});

export const checkConditionalRules: CheckConditionalRules = (arg, checker) => {
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

export const checkEq: CheckEqNe = (arg) => {
  const { rule, value } = arg;
  if (rule.eq === undefined) return [];
  return rule.eq === value ? [] : [createErrorResult('eq', arg)];
};

export const checkNe: CheckEqNe = (arg) => {
  const { rule, value } = arg;
  if (rule.ne === undefined) return [];
  return rule.ne !== value ? [] : [createErrorResult('ne', arg)];
};

export const checkEqNe: CheckEqNe = (arg) =>
  [checkEq(arg), checkNe(arg)].flatMap((errors) => errors);

export const checkGe: CheckPrimitive = (arg) => {
  const { rule, value } = arg;
  if (rule.ge === undefined) return [];
  return rule.ge <= value ? [] : [createErrorResult('ge', arg)];
};

export const checkGt: CheckPrimitive = (arg) => {
  const { rule, value } = arg;
  if (rule.gt === undefined) return [];
  return rule.gt < value ? [] : [createErrorResult('gt', arg)];
};

export const checkLe: CheckPrimitive = (arg) => {
  const { rule, value } = arg;
  if (rule.le === undefined) return [];
  return rule.le >= value ? [] : [createErrorResult('le', arg)];
};

export const checkLt: CheckPrimitive = (arg) => {
  const { rule, value } = arg;
  if (rule.lt === undefined) return [];
  return rule.lt > value ? [] : [createErrorResult('lt', arg)];
};

export const checkBetween: CheckPrimitive = (arg) => {
  const { rule, value } = arg;
  if (rule.between === undefined) return [];
  return rule.between[0] < value && value < rule.between[1]
    ? []
    : [createErrorResult('between', arg)];
};

export const checkOneOf: CheckPrimitive = (arg) => {
  const { rule, value } = arg;
  if (rule.oneOf === undefined) return [];
  return rule.oneOf.includes(value as any) ? [] : [createErrorResult('oneOf', arg)];
};

export const checkPrimitive: CheckPrimitive = (arg) =>
  [
    checkEqNe(arg),
    checkGe(arg),
    checkGt(arg),
    checkLe(arg),
    checkLt(arg),
    checkBetween(arg),
    checkOneOf(arg),
  ].flatMap((errors) => errors);

export const isNullable = (type: TypeOf): type is NullableType =>
  (nullableTypes as unknown as TypeOf).includes(type);

export const checkRequiredRule: CheckBase = (arg) => {
  const { rule, type } = arg;
  if (!rule.required) return [];
  if (!isNullable(type)) return [];
  return [createErrorResult('required', arg)];
};

export const checkDisallowUndefined: CheckBase = (arg) => {
  const { rule, type } = arg;
  if (type !== 'undefined') return [];
  if (!rule.disallowUndefined) return [];
  return [createErrorResult('disallowUndefined', arg)];
};

export const checkDisallowNull: CheckBase = (arg) => {
  const { rule, type } = arg;
  if (type !== 'null') return [];
  if (!rule.disallowNull) return [];
  return [createErrorResult('disallowNull', arg)];
};

export const checkDisallowNokey: CheckBase = (arg) => {
  const { rule, type } = arg;
  if (type !== 'nokey') return [];
  if (!rule.disallowNokey) return [];
  return [createErrorResult('disallowNokey', arg)];
};

export const checkNullableDisallowRule: CheckBase = (arg) =>
  [checkDisallowUndefined(arg), checkDisallowNull(arg), checkDisallowNokey(arg)].flatMap(
    (errors) => errors
  );

export const checkExistenceRules: CheckBase = (arg) => {
  const requiredErrors = checkRequiredRule(arg);
  if (requiredErrors.length !== 0) return requiredErrors;
  return checkNullableDisallowRule(arg);
};

export const checkType: CheckBase = (arg) => {
  const { rule, type } = arg;
  if (isNullable(type)) return []; // after existence rules check
  if (rule.type === type) return [];
  return [createErrorResult('type', arg)];
};

export const checkBoolean: CheckBoolean = (arg) => checkEqNe(arg);

export const checkNumber: CheckNumber = (arg) => checkConditionalRules(arg, checkPrimitive);

export const checkBigInt: CheckBigInt = (arg) => checkConditionalRules(arg, checkPrimitive);

export const checkBeginsWith: CheckStringBaseRules = (arg) => {
  const { rule, value } = arg;
  if (rule.beginsWith === undefined) return [];
  return value.startsWith(rule.beginsWith) ? [] : [createErrorResult('beginsWith', arg)];
};

export const checkContains: CheckStringBaseRules = (arg) => {
  const { rule, value } = arg;
  if (rule.contains === undefined) return [];
  return value.includes(rule.contains) ? [] : [createErrorResult('contains', arg)];
};

export const checkNotContains: CheckStringBaseRules = (arg) => {
  const { rule, value } = arg;
  if (rule.notContains === undefined) return [];
  return !value.includes(rule.notContains) ? [] : [createErrorResult('notContains', arg)];
};

export const checkPattern: CheckStringBaseRules = (arg) => {
  const { rule, value } = arg;
  if (rule.pattern === undefined) return [];
  return rule.pattern.test(value) ? [] : [createErrorResult('pattern', arg)];
};

export const checkNotPattern: CheckStringBaseRules = (arg) => {
  const { rule, value } = arg;
  if (rule.notPattern === undefined) return [];
  return !rule.notPattern.test(value) ? [] : [createErrorResult('notPattern', arg)];
};

export const checkStringBaseRules: CheckStringBaseRules = (arg) =>
  [
    checkPrimitive(arg),
    checkBeginsWith(arg),
    checkContains(arg),
    checkNotContains(arg),
    checkPattern(arg),
    checkNotPattern(arg),
  ].flatMap((errors) => errors);

export const convertStringToBoolean = (value: string): boolean | undefined => {
  const lower = value.toLowerCase();
  const trueValues = ['y', 'yes', 't', 'true', 'on', '1'];
  const falseValues = ['n', 'no', 'f', 'false', 'off', '0'];
  if (trueValues.includes(lower)) return true;
  if (falseValues.includes(lower)) return false;
  return undefined;
};

export const checkStringAsBoolean: CheckStringRules = (arg) => {
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

export const checkStringAsBigInt: CheckStringRules = (arg) => {
  if (arg.rule.asBigInt === undefined) return [];
  const { rule, value } = arg;
  const valueAsBigInt = createBigIntSafely(value);
  if (valueAsBigInt === undefined) return [createErrorResult('asBigInt', arg)];
  return checkBigInt({ ...arg, rule: { type: 'bigint', ...rule.asNumber }, value: valueAsBigInt });
};

export const checkStringLength: CheckStringRules = (arg) => {
  if (arg.rule.length === undefined) return [];
  const { rule, value, path } = arg;
  return checkPrimitive({
    ...arg,
    rule: rule.length,
    value: value.length,
    path: [...path, 'length'],
  });
};

export const checkStringRules: CheckStringRules = (arg) =>
  [
    checkStringBaseRules(arg),
    checkStringAsBoolean(arg),
    checkStringAsNumber(arg),
    checkStringAsBigInt(arg),
    checkStringLength(arg),
  ].flatMap((errors) => errors);

export const checkString: CheckString = (arg) => checkConditionalRules(arg, checkStringRules);

export const checkArrayMetaRules: CheckArray = (arg) => {
  const { label } = arg;
  const rule = arg.rule.length;
  const value = (arg.value as []).length;
  const path = arg.path.concat('length');
  const lengthArgs = { type: 'number', rule, value, path, label } as const;
  return checkConditionalRules(lengthArgs, checkPrimitive);
};

export const checkArray: CheckArray = (arg) => {
  const errors = checkArrayMetaRules(arg);

  const childrenErrors = (arg.value as []).flatMap((value, index) => {
    const rule = arg.rule.elements;
    const type = getType(value);
    const path = arg.path.concat([index]);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return checkByType({ rule, type, value, path });
  });
  return errors.concat(childrenErrors);
};

export const checkObjectDisallowUndefinedKeys: CheckObject = (arg) => {
  const { rule, value } = arg;
  const disallowUndefinedKeys: boolean = rule.disallowUndefinedKeys ?? false;
  if (!disallowUndefinedKeys) return [];
  const ruleKeySet = new SetEx(objectKeys(rule.keys));
  const dataKeySet = new SetEx(objectKeys(value as object));
  if (ruleKeySet.isSuperset(dataKeySet)) return [];
  return [createErrorResult('disallowUndefinedKeys', arg)];
};

export const checkObject: CheckObject = (arg) => {
  const errors: ErrorResult[] = [checkObjectDisallowUndefinedKeys(arg)].flatMap((error) => error);

  const childrenErrors = objectKeys(arg.rule.keys).flatMap((key) => {
    const rule = arg.rule.keys[key];
    const value = arg.value[key];
    const type = getTypeFromParent(arg.value, key);
    const path = arg.path.concat([key]);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return checkByType({ rule, type, value, path });
  });
  return errors.concat(childrenErrors);
};

export const checkByType: CheckByType = (arg) => {
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
