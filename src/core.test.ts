import { functions, CheckArgs, StringRules, ObjectPath, Data } from './core';

const { getTypeFromParent, checkStringAsNumber, createBigIntSafely, setRule } = functions;

type TestData = {
  a1: boolean;
  b1: number;
  c1: string;
  d1: string[];
  e1: { a: boolean; b: number };
  f1: { a: boolean; b: number }[];
  // a2?: boolean;
  // b2?: number;
  // c2?: string;
  // d2?: string[];
  // e2?: { a?: boolean; b?: number };
  // f2?: { a?: boolean; b?: number; }[];
  // a3: boolean | null;
  // b3: number | null;
  // c3: string | null;
  // d3: string[] | null;
  // e3: { a: boolean | null; b: number | null } | null;
  // f3: { a: boolean | null; b: number | null }[] | null;
};

type TestPath = ObjectPath<TestData>;
const testObjTarget = <T>(...p: ObjectPath<T>) => {};
testObjTarget<TestData>('d1')

describe('returnType', () => {
  test('boolean', () => expect(getTypeFromParent({ a: true }, 'a')).toBe('boolean'));
  test('number', () => expect(getTypeFromParent({ a: 0 }, 'a')).toBe('number'));
  // test('bigint', () => expect(returnType({ a: 1n }, 'a')).toBe('bigint'));
  test('string', () => expect(getTypeFromParent({ a: 'a' }, 'a')).toBe('string'));
  test('array', () => expect(getTypeFromParent({ a: ['a'] }, 'a')).toBe('array'));
  test('object', () => expect(getTypeFromParent({ a: {} }, 'a')).toBe('object'));
  test('null', () => expect(getTypeFromParent({ a: null }, 'a')).toBe('null'));
  test('undefined', () => expect(getTypeFromParent({ a: undefined }, 'a')).toBe('undefined'));
  test('nokey', () => expect(getTypeFromParent({ a: 'a' }, 'b')).toBe('nokey'));
  test('function', () => expect(getTypeFromParent({ a: () => 1 }, 'a')).toBe('function'));
});

describe('Number()', () => {
  test('"10"', () => expect(Number('10')).toBe(10));
  test('"text"', () => expect(Number('text')).toBe(NaN));
});

describe('createBigIntSafely()', () => {
  test('"10"', () => expect(createBigIntSafely('10')).toBe(10n));
  test('"text"', () => expect(createBigIntSafely('text')).toBe(undefined));
});

describe('checkStringAsBoolean', () => {
  const args: Omit<CheckArgs<StringRules, string>, 'value'> = { type: 'string', rule: { asBoolean: {} }, path: [] };
  test('"10"', () => expect(checkStringAsNumber({ ...args, value: '10' })).toEqual([]));
  test('"text"', () => expect(checkStringAsNumber({ ...args, value: 'text' })).toEqual([]));
});
