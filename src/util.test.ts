import { objectKeys, getType, getTypeFromParent } from "./util";

describe('objectKeys', () => {
  test('boolean', () => expect(objectKeys({ a: true })).toEqual(['a']));
});

describe('getType', () => {
  test('boolean', () => expect(getType(true)).toBe('boolean'));
  test('number', () => expect(getType(0 )).toBe('number'));
  test('bigint', () => expect(getType(1n)).toBe('bigint'));
  test('string', () => expect(getType('a')).toBe('string'));
  test('array', () => expect(getType(['a'])).toBe('array'));
  test('object', () => expect(getType({})).toBe('object'));
  test('null', () => expect(getType(null)).toBe('null'));
  test('undefined', () => expect(getType(undefined)).toBe('undefined'));
  test('function', () => expect(getType(() => 1)).toBe('function'));
});

describe('getTypeFromParent', () => {
  test('nokey', () => expect(getTypeFromParent({ a: 'a' }, 'b')).toBe('nokey'));

  test('boolean', () => expect(getTypeFromParent({ a: true }, 'a')).toBe('boolean'));
  test('number', () => expect(getTypeFromParent({ a: 0 }, 'a')).toBe('number'));
  test('bigint', () => expect(getTypeFromParent({ a: 1n }, 'a')).toBe('bigint'));
  test('string', () => expect(getTypeFromParent({ a: 'a' }, 'a')).toBe('string'));
  test('array', () => expect(getTypeFromParent({ a: ['a'] }, 'a')).toBe('array'));
  test('object', () => expect(getTypeFromParent({ a: {} }, 'a')).toBe('object'));
  test('null', () => expect(getTypeFromParent({ a: null }, 'a')).toBe('null'));
  test('undefined', () => expect(getTypeFromParent({ a: undefined }, 'a')).toBe('undefined'));
  test('function', () => expect(getTypeFromParent({ a: () => 1 }, 'a')).toBe('function'));
});
