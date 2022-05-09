import {
  checkConditionalRules,
  checkLimit,
  checkStringAsNumber,
  checkStringRules,
  createBigIntSafely,
  createErrorResult,
  isAND,
  isOR,
} from './check';
import { Arg } from './types/check';
import { NumberRuleDef, StringRuleDef, StringRules } from './types/rule-def';

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
  const args: Omit<Arg<StringRules, string>, 'value'> = {
    type: 'string',
    rule: { eq: 'hoge' },
    path: [],
  };
  test('hoge => foo', () =>
    expect(createErrorResult('eq', { ...args, value: 'foo' })).toEqual({
      rule: { name: 'eq', value: 'hoge' },
      value: 'foo',
      code: 'eq',
      path: [],
      label: undefined,
    }));
});

describe('checkConditionalRules', () => {
  describe('or', () => {
    const args: Omit<Arg<NumberRuleDef, string>, 'value'> = {
      type: 'number',
      rule: { type: 'number', or: [{ lt: 3 }, { gt: 10 }] },
      path: [],
    };
    test('x < 3 or 10 < x, x == 2', () =>
      expect(checkConditionalRules({ ...args, value: 2 }, checkLimit)).toEqual([]));
    test('x < 3 or 10 < x, x == 5', () =>
      expect(checkConditionalRules({ ...args, value: 5 }, checkLimit)).toEqual([
        { code: 'lt', label: undefined, path: [], rule: { name: 'lt', value: 3 }, value: 5 },
        { code: 'gt', label: undefined, path: [], rule: { name: 'gt', value: 10 }, value: 5 },
      ]));
  });

  describe('and', () => {
    const args: Omit<Arg<StringRuleDef, string>, 'value'> = {
      type: 'number',
      rule: { type: 'string', and: [{ contains: 'hello' }, { contains: 'goodbye' }] },
      path: [],
    };
    test('hello!! goodbye!!', () =>
      expect(checkConditionalRules({ ...args, value: 'hello!! goodbye!!' }, checkStringRules)).toEqual(
        []
      ));
    test('hello!', () =>
      expect(checkConditionalRules({ ...args, value: 'hello!' }, checkStringRules)).toEqual([
        {
          code: 'contains',
          label: undefined,
          path: [],
          rule: { name: 'contains', value: 'goodbye' },
          value: 'hello!',
        },
      ]));
  });
});

describe('checkEq', () => {
  const args: Omit<Arg<StringRules, string>, 'value'> = {
    type: 'string',
    rule: { eq: 'hoge' },
    path: [],
  };
  test('hoge == hoge', () => expect(checkStringAsNumber({ ...args, value: 'hoge' })).toEqual([]));
  test('hoge == foo ', () => expect(checkStringAsNumber({ ...args, value: 'foo' })).toEqual([]));
});

describe('createBigIntSafely()', () => {
  test('"10"', () => expect(createBigIntSafely('10')).toBe(10n));
  test('"text"', () => expect(createBigIntSafely('text')).toBe(undefined));
});

describe('checkStringAsNumber', () => {
  const args: Omit<Arg<StringRules, string>, 'value'> = {
    type: 'string',
    rule: { asBoolean: {} },
    path: [],
  };
  test('"10"', () => expect(checkStringAsNumber({ ...args, value: '10' })).toEqual([]));
  test('"text"', () => expect(checkStringAsNumber({ ...args, value: 'text' })).toEqual([]));
});

