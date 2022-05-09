import SetEx from './set';

describe('Set extensions', () => {
  const a = new SetEx([1, 2, 3]);
  const b = new SetEx([2, 4, 6]);
  const c = new SetEx([1, 2, 3, 4, 5, 6]);

  test('union', () => {
    const result = [...a.union(b)].sort();
    expect(result).toEqual([1, 2, 3, 4, 6]);
  });
  test('difference', () => {
    const result1 = [...a.difference(b)].sort();
    expect(result1).toEqual([1, 3]);
    const result2 = [...a.difference(c)].sort();
    expect(result2).toEqual([]);
  });
  test('intersection', () => {
    const result1 = [...a.intersection(b)].sort();
    expect(result1).toEqual([2]);
    const result2 = [...b.intersection(c)].sort();
    expect(result2).toEqual([2, 4, 6]);
  });
  test('equals', () => {
    const d = new SetEx([1, 2, 3]);
    expect(a.equals(d)).toBe(true);
    expect(d.equals(a)).toBe(true);
    expect(b.equals(c)).toBe(false);
  });
  test('isSubset', () => {
    expect(a.isSubset(c)).toBe(true);
    expect(c.isSubset(a)).toBe(false);
    expect(a.isSubset(b)).toBe(false);
  });
  test('isSuperset', () => {
    expect(c.isSuperset(a)).toBe(true);
    expect(a.isSuperset(c)).toBe(false);
    expect(b.isSuperset(a)).toBe(false);
  });
});
