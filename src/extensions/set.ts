export {};
// 注意: 拡張メソッドを使用する場合はimportします
declare global {
  interface Set<T> {
    /** 和集合 */
    union(set: Set<T>): Set<T>;
    /** 差集合 */
    difference(set: Set<T>): Set<T>;
    /** 積集合 */
    intersection(set: Set<T>): Set<T>;
    /** 互いに素 */
    isDisjoint(set: Set<T>): boolean;
    /** 等しい */
    equals(set: Set<T>): boolean;
    /** A.isSubset(B) => AはBの部分集合かどうか */
    isSubset(set: Set<T>): boolean;
    /** A.isSuperset(B) => AはBの超集合かどうか */
    isSuperset(set: Set<T>): boolean;
  }
}

Set.prototype.union = function <T>(set: Set<T>): Set<T> {
  const self = this as Set<T>;
  return new Set([...self, ...set]);
};

Set.prototype.difference = function <T>(set: Set<T>): Set<T> {
  const self = this as Set<T>;
  const diffSet = new Set(self);
  set.forEach((elem) => diffSet.delete(elem));
  return diffSet;
};

Set.prototype.intersection = function <T>(set: Set<T>): Set<T> {
  const self = this as Set<T>;
  const intersectionSet: Set<T> = new Set();
  set.forEach((elem) => self.has(elem) && intersectionSet.add(elem));
  return intersectionSet;
};

Set.prototype.isDisjoint = function <T>(set: Set<T>): boolean {
  const self = this as Set<T>;
  return self.intersection(set).size === 0;
};

Set.prototype.equals = function <T>(set: Set<T>): boolean {
  const self = this as Set<T>;
  const intersectionSize = self.intersection(set).size;
  return intersectionSize === self.size && intersectionSize === set.size;
};

Set.prototype.isSubset = function <T>(set: Set<T>): boolean {
  const self = this as Set<T>;
  return self.difference(set).size === 0;
};

Set.prototype.isSuperset = function <T>(set: Set<T>): boolean {
  const self = this as Set<T>;
  return set.difference(self).size === 0;
};
