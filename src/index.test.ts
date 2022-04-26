import { returnType } from './index';

describe('returnType', () => {
  test('boolean', () => expect(returnType({ a: true }, 'a')).toBe('boolean'));
  test('number', () => expect(returnType({ a: 0 }, 'a')).toBe('number'));
  // test('bigint', () => expect(returnType({ a: 1n }, 'a')).toBe('bigint'));
  test('string', () => expect(returnType({ a: 'a' }, 'a')).toBe('string'));
  test('array', () => expect(returnType({ a: ['a'] }, 'a')).toBe('array'));
  test('object', () => expect(returnType({ a: {} }, 'a')).toBe('object'));
  test('null', () => expect(returnType({ a: null }, 'a')).toBe('null'));
  test('undefined', () => expect(returnType({ a: undefined }, 'a')).toBe('undefined'));
  test('nokey', () => expect(returnType({ a: 'a' }, 'b')).toBe('nokey'));
  test('function', () => expect(returnType({ a: () => 1 }, 'a')).toBe('function'));
});
