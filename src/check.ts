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
import { nullableTypes, TypeOf, NullableType } from './types/type-of';
import { getType, getTypeFromParent, objectKeys } from './util';

import './extensions/array';
import './extensions/set';

const isAND = <T>(rule: Conditional<T>): rule is AND<T> => getType((rule as any)?.and) === 'array';
const isOR = <T>(rule: Conditional<T>): rule is OR<T> => getType((rule as any)?.or) === 'array';

const createErrorResult: CreateErrorResult = (rule, arg) => {
  return {
    rule: { name: rule, value: arg.rule[rule] },
    value: arg.value,
    code: arg.rule[`${rule}ErrorCode`] ?? rule,
    path: arg.path,
    label: arg.label,
  };
};

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

const checkEqNe: CheckEqNe = (arg) => {
  const { rule, value } = arg;
  const errors: ErrorResult[] = [];
  if (rule.eq !== undefined && !(rule.eq === value)) errors.push(createErrorResult('eq', arg));
  if (rule.ne !== undefined && !(rule.ne !== value)) errors.push(createErrorResult('ne', arg));
  return errors;
};

const checkLimit: CheckLimit = <T>(arg) => {
  // eq?: T; ne?: T;
  const errors: ErrorResult[] = checkEqNe(arg);
  const { rule, value } = arg;
  if (rule.ge !== undefined && !(rule.ge <= value)) errors.push(createErrorResult('ge', arg));
  if (rule.gt !== undefined && !(rule.gt < value)) errors.push(createErrorResult('gt', arg));
  if (rule.le !== undefined && !(rule.le >= value)) errors.push(createErrorResult('le', arg));
  if (rule.lt !== undefined && !(rule.lt > value)) errors.push(createErrorResult('lt', arg));
  if (rule.between !== undefined && !(rule.between[0] < value && value < rule.between[1])) {
    errors.push(createErrorResult('between', arg));
  }
  if (rule.oneOf !== undefined && !rule.oneOf.includes(value as T)) errors.push(createErrorResult('oneOf', arg));
  return errors;
};

const isNullable = (type: TypeOf): type is NullableType => (nullableTypes as unknown as TypeOf).includes(type);

const checkRequiredRule: CheckBase = (arg) => {
  const { rule, type } = arg;
  if (!rule.required) return [];
  return isNullable(type) ? [createErrorResult('required', arg)] : [];
};

const checkNullableDisallowRule: CheckBase = (arg) => {
  const { rule, type } = arg;
  if (!isNullable(type)) return [];
  switch (type) {
    case 'undefined': {
      if (!rule.disallowUndefined) return [];
      return [createErrorResult('disallowUndefined', arg)];
    }
    case 'null': {
      if (!rule.disallowNull) return [];
      return [createErrorResult('disallowNull', arg)];
    }
    case 'nokey': {
      if (!rule.disallowNokey) return [];
      return [createErrorResult('disallowNokey', arg)];
    }
  }
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

const checkStringBaseRules: CheckStringBaseRules = (arg) => {
  const errors = checkLimit(arg);
  const { rule, value: unknownValue, path, label } = arg;
  const value = unknownValue as string;
  // beginsWith?: string;
  if (rule.beginsWith !== undefined && !value.startsWith(rule.beginsWith)) {
    errors.push(createErrorResult('beginsWith', arg));
  }
  // contains?: string;
  if (rule.contains !== undefined && !value.includes(rule.contains)) {
    errors.push(createErrorResult('contains', arg));
  }
  // notContains?: string;
  if (rule.notContains !== undefined && value.includes(rule.notContains)) {
    errors.push(createErrorResult('notContains', arg));
  }
  // pattern?: RegExp;
  if (rule.pattern !== undefined && !rule.pattern.test(value)) {
    errors.push(createErrorResult('pattern', arg));
  }
  // notPattern?: RegExp;
  if (rule.notPattern !== undefined && rule.notPattern.test(value)) {
    errors.push(createErrorResult('notPattern', arg));
  }
  return errors;
};

const checkStringAsBoolean: CheckStringRules = (arg) => {
  if (arg.rule.asBoolean === undefined) return [];
  const { rule, value } = arg;
  const lower = value.toLowerCase();
  const trueValues = ['y', 'yes', 't', 'true', 'on', '1'];
  const falseValues = ['n', 'no', 'f', 'false', 'off', '0'];
  const valueAsBoolean = trueValues.includes(lower) ? true : falseValues.includes(lower) ? false : undefined;
  if (valueAsBoolean === undefined) return [createErrorResult('asBoolean', arg)];
  return checkBoolean({ ...arg, rule: { type: 'boolean', ...rule.asBoolean }, value: valueAsBoolean });
};

export const checkStringAsNumber: CheckStringRules = (arg) => {
  if (arg.rule.asNumber === undefined) return [];
  const { rule, value } = arg;
  const valueAsNumber = Number(value);
  if (isNaN(valueAsNumber)) return [createErrorResult('asNumber', arg)];
  return checkNumber({ ...arg, rule: { type: 'number', ...rule.asNumber }, value: valueAsNumber });
};

export const createBigIntSafely = (value: string | number | bigint | boolean): bigint | undefined =>
  !isNaN(Number(value)) ? BigInt(value) : undefined;

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

const checkStringRules: CheckStringRules = (arg) => {
  return [
    checkStringBaseRules(arg),
    checkStringAsBoolean(arg),
    checkStringAsNumber(arg),
    checkStringAsBigInt(arg),
    checkStringLength(arg),
  ].flatMap((errors) => errors);
};

const checkString: CheckString = (arg) => checkConditionalRules(arg, checkStringRules);

const checkArrayMetaRules: CheckArray = (arg) => {
  const { label } = arg;
  const rule = arg.rule.length;
  const value = (arg.value as []).length;
  const path = arg.path.concat('length');
  return checkConditionalRules({ type: 'number', rule, value, path, label }, checkLimit);
};

const checkArray: CheckArray = (arg) => {
  const errors = checkArrayMetaRules(arg);

  const childrenErrors = (arg.value as []).flatMap((value, index) => {
    const rule = arg.rule.elements;
    const type = getType(value);
    const path = arg.path.concat([index])
    return check({ rule, type, value, path });
  });
  return errors.concat(childrenErrors);
};

const checkObjectDisallowUndefinedKeys: CheckObject = (arg) => {
  const { rule, value } = arg;
  const disallowUndefinedKeys: boolean = rule.disallowUndefinedKeys ?? false;
  if (!disallowUndefinedKeys) return [];
  const ruleKeySet = objectKeys(rule.keys).set();
  const dataKeySet = objectKeys(value as object).set();
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
