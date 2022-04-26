import { returnType, config } from './index';

type TestData = {
  a1: boolean;
  b1: number;
  c1: string;
  d1: string[];
  e1: { a: boolean; b: number; };
  f1: { a: boolean; b: number; }[];
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

const data: any = {};
const results = config()
  .rules<TestData>({
    a1: { type: 'boolean' },
    b1: { type: 'number' },
    c1: { type: 'string' },
    d1: { type: 'array', elements: { type: 'string' } },
    e1: { type: 'object', keys: { a: { type: 'boolean'}, b: { type: 'number' } } },
    f1: { type: 'array', elements: { type: 'object', keys: { a: { type: 'boolean' }, b:{type: 'number'} } } },
  })
  .check(data);

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
