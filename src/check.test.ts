import {
  checkBetween,
  checkConditionalRules,
  checkDisallowNokey,
  checkDisallowNull,
  checkDisallowUndefined,
  checkEq,
  checkEqNe,
  checkExistenceRules,
  checkGe,
  checkGt,
  checkLe,
  checkLt,
  checkNe,
  checkNullableDisallowRule,
  checkOneOf,
  checkPrimitive,
  checkRequiredRule,
  checkStringAsBigInt,
  checkStringAsNumber,
  checkStringRules,
  createBigIntSafely,
  createErrorResult,
  isAND,
  isNullable,
  isOR,
} from './check';
import { Arg } from './types/check';
import {
  BaseRuleDef,
  NumberRuleDef,
  NumberRules,
  StringRuleDef,
  StringRules,
} from './types/rule-def';

type BaseArg = Omit<Arg<BaseRuleDef, any>, 'type'>;
type NumArg = Omit<Arg<NumberRules, any>, 'value'>;
type NumDefArg = Omit<Arg<NumberRuleDef, any>, 'value'>;
type StrArg = Omit<Arg<StringRules, any>, 'value'>;
type StrDefArg = Omit<Arg<StringRuleDef, any>, 'value'>;

const path: (string | number)[] = [];

describe('isAND()', () => {
  test('{ and: [] }', () => expect(isAND({ and: [] })).toBe(true));
  test('{ or: [] }', () => expect(isAND({ or: [] })).toBe(false));
  test('{ }', () => expect(isAND({})).toBe(false));
  test('{ and: null }', () => expect(() => isAND({ and: null })).toThrow());
});

describe('isOR()', () => {
  test('{ or: [] }', () => expect(isOR({ or: [] })).toBe(true));
  test('{ and: [] }', () => expect(isOR({ and: [] })).toBe(false));
  test('{ }', () => expect(isOR({})).toBe(false));
  test('{ or: null }', () => expect(() => isOR({ or: null })).toThrow());
});

describe('createErrorResult()', () => {
  const args: StrArg = { type: 'string', rule: { eq: 'hoge' }, path };
  test('hoge => foo', () =>
    expect(createErrorResult('eq', { ...args, value: 'foo' })).toEqual({
      rule: { name: 'eq', value: 'hoge' },
      value: 'foo',
      code: 'eq',
      path,
    }));
});

describe('checkConditionalRules', () => {
  describe('or', () => {
    const args: NumDefArg = {
      type: 'number',
      rule: { type: 'number', or: [{ lt: 3 }, { gt: 10 }] },
      path,
    };
    test('x < 3 or 10 < x, x == 2', () =>
      expect(checkConditionalRules({ ...args, value: 2 }, checkPrimitive)).toEqual([]));
    test('x < 3 or 10 < x, x == 5', () =>
      expect(checkConditionalRules({ ...args, value: 5 }, checkPrimitive)).toEqual([
        { code: 'lt', path, rule: { name: 'lt', value: 3 }, value: 5 },
        { code: 'gt', path, rule: { name: 'gt', value: 10 }, value: 5 },
      ]));
  });

  describe('and', () => {
    const args: StrDefArg = {
      type: 'number',
      rule: { type: 'string', and: [{ contains: 'hello' }, { contains: 'goodbye' }] },
      path,
    };
    test('hello!! goodbye!!', () =>
      expect(
        checkConditionalRules({ ...args, value: 'hello!! goodbye!!' }, checkStringRules)
      ).toEqual([]));
    test('hello!', () =>
      expect(checkConditionalRules({ ...args, value: 'hello!' }, checkStringRules)).toEqual([
        { code: 'contains', path, rule: { name: 'contains', value: 'goodbye' }, value: 'hello!' },
      ]));
  });
});

describe('checkEq', () => {
  const args: StrArg = { type: 'string', rule: { eq: 'hoge' }, path };
  test('hoge === hoge', () => expect(checkEq({ ...args, value: 'hoge' })).toEqual([]));
  test('hoge === foo ', () =>
    expect(checkEq({ ...args, value: 'foo' })).toEqual([
      { code: 'eq', path, rule: { name: 'eq', value: 'hoge' }, value: 'foo' },
    ]));
});

describe('checkNe', () => {
  const args: StrArg = { type: 'string', rule: { ne: 'foo' }, path };
  test('foo !== hoge', () => expect(checkNe({ ...args, value: 'hoge' })).toEqual([]));
  test('foo !== foo ', () =>
    expect(checkNe({ ...args, value: 'foo' })).toEqual([
      { code: 'ne', path, rule: { name: 'ne', value: 'foo' }, value: 'foo' },
    ]));
});

describe('checkEqNe', () => {
  const args: StrArg = { type: 'string', rule: { eq: 'hoge', ne: 'foo' }, path };
  test('hoge === hoge', () => expect(checkEqNe({ ...args, value: 'hoge' })).toEqual([]));
  test('hoge === foo ', () =>
    expect(checkEqNe({ ...args, value: 'foo' })).toEqual([
      { code: 'eq', path, rule: { name: 'eq', value: 'hoge' }, value: 'foo' },
      { code: 'ne', path, rule: { name: 'ne', value: 'foo' }, value: 'foo' },
    ]));
});

describe('checkGe', () => {
  const args: StrArg = { type: 'string', rule: { ge: '2022-05-17' }, path };
  test('2022-05-17 <= 2022-05-18', () =>
    expect(checkGe({ ...args, value: '2022-05-18' })).toEqual([]));
  test('2022-05-17 <= 2022-05-17', () =>
    expect(checkGe({ ...args, value: '2022-05-17' })).toEqual([]));
  test('2022-05-17 <= 2022-05-16', () =>
    expect(checkGe({ ...args, value: '2022-05-16' })).toEqual([
      { code: 'ge', path, rule: { name: 'ge', value: '2022-05-17' }, value: '2022-05-16' },
    ]));
});

describe('checkGt', () => {
  const args: StrArg = { type: 'string', rule: { gt: '2022-05-16' }, path };
  test('2022-05-16 <= 2022-05-17', () =>
    expect(checkGt({ ...args, value: '2022-05-17' })).toEqual([]));
  test('2022-05-16 <= 2022-05-16', () =>
    expect(checkGt({ ...args, value: '2022-05-16' })).toEqual([
      { code: 'gt', path, rule: { name: 'gt', value: '2022-05-16' }, value: '2022-05-16' },
    ]));
});

describe('checkLe', () => {
  const args: NumArg = { type: 'number', rule: { le: 10 }, path };
  test('10 >= 9', () => expect(checkLe({ ...args, value: 9 })).toEqual([]));
  test('10 >= 10', () => expect(checkLe({ ...args, value: 10 })).toEqual([]));
  test('10 >= 11', () =>
    expect(checkLe({ ...args, value: 11 })).toEqual([
      { code: 'le', path, rule: { name: 'le', value: 10 }, value: 11 },
    ]));
});

describe('checkLt', () => {
  const args: NumArg = { type: 'number', rule: { lt: 10 }, path };
  test('10 > 9', () => expect(checkLt({ ...args, value: 9 })).toEqual([]));
  test('10 > 10', () =>
    expect(checkLt({ ...args, value: 10 })).toEqual([
      { code: 'lt', path, rule: { name: 'lt', value: 10 }, value: 10 },
    ]));
});

describe('checkBetween', () => {
  const args: NumArg = { type: 'number', rule: { between: [5, 10] }, path };
  test('5 < 6 < 10', () => expect(checkBetween({ ...args, value: 6 })).toEqual([]));
  test('5 < 9 < 10', () => expect(checkBetween({ ...args, value: 9 })).toEqual([]));
  test('5 < 5 < 10', () =>
    expect(checkBetween({ ...args, value: 5 })).toEqual([
      { code: 'between', path, rule: { name: 'between', value: [5, 10] }, value: 5 },
    ]));
  test('5 < 10 < 10', () =>
    expect(checkBetween({ ...args, value: 10 })).toEqual([
      { code: 'between', path, rule: { name: 'between', value: [5, 10] }, value: 10 },
    ]));
});

describe('checkOneOf', () => {
  const args: NumArg = { type: 'number', rule: { oneOf: [1, 2, 3] }, path };
  test('1 in [1,2,3]', () => expect(checkOneOf({ ...args, value: 1 })).toEqual([]));
  test('5 in [1,2,3]', () =>
    expect(checkOneOf({ ...args, value: 5 })).toEqual([
      { code: 'oneOf', path, rule: { name: 'oneOf', value: [1, 2, 3] }, value: 5 },
    ]));
});

describe('checkPrimitive', () => {
  const args: NumArg = { type: 'number', rule: { lt: 10 }, path };
  test('10 > 9', () => expect(checkPrimitive({ ...args, value: 9 })).toEqual([]));
  test('10 > 10', () =>
    expect(checkPrimitive({ ...args, value: 10 })).toEqual([
      { code: 'lt', path, rule: { name: 'lt', value: 10 }, value: 10 },
    ]));
});

describe('isNullable()', () => {
  test('undefined', () => expect(isNullable('undefined')).toBe(true));
  test('null', () => expect(isNullable('null')).toBe(true));
  test('nokey', () => expect(isNullable('nokey')).toBe(true));
  test('symbol is not nullable', () => expect(isNullable('symbol')).toBe(false));
});

describe('checkRequiredRule', () => {
  const args: BaseArg = { rule: { type: 'string', required: true }, path, value: null };
  test('type: "string"', () => expect(checkRequiredRule({ ...args, type: 'string' })).toEqual([]));
  test('type: "null"', () =>
    expect(checkRequiredRule({ ...args, type: 'null' })).toEqual([
      { code: 'required', path, rule: { name: 'required', value: true }, value: null },
    ]));
});

describe('checkDisallowUndefined', () => {
  const args: BaseArg = { rule: { type: 'string', disallowUndefined: true }, path, value: null };
  test('type: "string"', () =>
    expect(checkDisallowUndefined({ ...args, type: 'string' })).toEqual([]));
  test('type: "undefined"', () =>
    expect(checkDisallowUndefined({ ...args, type: 'undefined' })).toEqual([
      {
        code: 'disallowUndefined',
        path,
        rule: { name: 'disallowUndefined', value: true },
        value: null,
      },
    ]));
});

describe('checkDisallowNull', () => {
  const args: BaseArg = { rule: { type: 'string', disallowNull: true }, path, value: null };
  test('type: "string"', () => expect(checkDisallowNull({ ...args, type: 'string' })).toEqual([]));
  test('type: "null"', () =>
    expect(checkDisallowNull({ ...args, type: 'null' })).toEqual([
      {
        code: 'disallowNull',
        path,
        rule: { name: 'disallowNull', value: true },
        value: null,
      },
    ]));
});

describe('checkDisallowNokey', () => {
  const args: BaseArg = { rule: { type: 'string', disallowNokey: true }, path, value: null };
  test('type: "string"', () => expect(checkDisallowNokey({ ...args, type: 'string' })).toEqual([]));
  test('type: "nokey"', () =>
    expect(checkDisallowNokey({ ...args, type: 'nokey' })).toEqual([
      {
        code: 'disallowNokey',
        path,
        rule: { name: 'disallowNokey', value: true },
        value: null,
      },
    ]));
});

describe('checkNullableDisallowRule', () => {
  const args: BaseArg = { rule: { type: 'string', disallowNokey: true }, path, value: null };
  test('type: "string"', () =>
    expect(checkNullableDisallowRule({ ...args, type: 'string' })).toEqual([]));
  test('type: "nokey"', () =>
    expect(checkNullableDisallowRule({ ...args, type: 'nokey' })).toEqual([
      {
        code: 'disallowNokey',
        path,
        rule: { name: 'disallowNokey', value: true },
        value: null,
      },
    ]));
});

describe('checkExistenceRules', () => {
  describe('required: true, disallowNull: true', () => {
    const args: BaseArg = {
      rule: { type: 'string', required: true, disallowNull: true },
      path,
      value: null,
    };
    test('type: "string"', () =>
      expect(checkExistenceRules({ ...args, type: 'string' })).toEqual([]));
    test('type: "null"', () =>
      expect(checkExistenceRules({ ...args, type: 'null' })).toEqual([
        { code: 'required', path, rule: { name: 'required', value: true }, value: null },
      ]));
  });
  describe('required: false, disallowNull: true', () => {
    const args: BaseArg = { rule: { type: 'string', disallowNull: true }, path, value: null };
    test('type: "string"', () =>
      expect(checkDisallowNull({ ...args, type: 'string' })).toEqual([]));
    test('type: "null"', () =>
      expect(checkDisallowNull({ ...args, type: 'null' })).toEqual([
        {
          code: 'disallowNull',
          path,
          rule: { name: 'disallowNull', value: true },
          value: null,
        },
      ]));
  });
});

describe('checkStringAsNumber', () => {
  const args: Omit<Arg<StringRules, string>, 'value'> = {
    type: 'string',
    rule: { asNumber: {} },
    path: [],
  };
  test('"10"', () => expect(checkStringAsNumber({ ...args, value: '10' })).toEqual([]));
  test('"text"', () =>
    expect(checkStringAsNumber({ ...args, value: 'text' })).toEqual([
      {
        code: 'asNumber',
        path: [],
        rule: { name: 'asNumber', value: {} },
        value: 'text',
      },
    ]));
});

describe('createBigIntSafely()', () => {
  test('"10"', () => expect(createBigIntSafely('10')).toBe(10n));
  test('"text"', () => expect(createBigIntSafely('text')).toBe(undefined));
});

describe('checkStringAsBigInt', () => {
  const args: Omit<Arg<StringRules, string>, 'value'> = {
    type: 'string',
    rule: { asBigInt: {} },
    path: [],
  };
  test('"10"', () => expect(checkStringAsBigInt({ ...args, value: '10' })).toEqual([]));
  test('"text"', () =>
    expect(checkStringAsBigInt({ ...args, value: 'text' })).toEqual([
      {
        code: 'asBigInt',
        path: [],
        rule: { name: 'asBigInt', value: {} },
        value: 'text',
      },
    ]));
});
