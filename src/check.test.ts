import { checkStringAsNumber, createBigIntSafely } from './check';
import { Arg } from './types/check';
import { StringRules } from './types/rule-def';

describe('createBigIntSafely()', () => {
  test('"10"', () => expect(createBigIntSafely('10')).toBe(10n));
  test('"text"', () => expect(createBigIntSafely('text')).toBe(undefined));
});

describe('checkStringAsBoolean', () => {
  const args: Omit<Arg<StringRules, string>, 'value'> = {
    type: 'string',
    rule: { asBoolean: {} },
    path: [],
  };
  test('"10"', () => expect(checkStringAsNumber({ ...args, value: '10' })).toEqual([]));
  test('"text"', () => expect(checkStringAsNumber({ ...args, value: 'text' })).toEqual([]));
});
