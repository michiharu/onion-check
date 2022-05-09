class SetEx<T> extends Set<T> {
  /** 和集合 */
  union(set: SetEx<T>): SetEx<T> {
    const self = this as unknown as SetEx<T>;
    return new SetEx<T>([...self, ...set]);
  }

  /** 差集合 */
  difference(set: SetEx<T>): SetEx<T> {
    const self = this as unknown as SetEx<T>;
    const diffSet = new SetEx<T>(self);
    set.forEach((elem) => diffSet.delete(elem));
    return diffSet;
  }

  /** 積集合 */
  intersection(set: SetEx<T>): SetEx<T> {
    const self = this as unknown as SetEx<T>;
    const intersectionSet: SetEx<T> = new SetEx<T>();
    set.forEach((elem) => self.has(elem) && intersectionSet.add(elem));
    return intersectionSet;
  }

  /** 互いに素 */
  isDisjoint(set: SetEx<T>): boolean {
    const self = this as unknown as SetEx<T>;
    return self.intersection(set).size === 0;
  }

  /** 等しい */
  equals(set: SetEx<T>): boolean {
    const self = this as unknown as SetEx<T>;
    const intersectionSize = self.intersection(set).size;
    return intersectionSize === self.size && intersectionSize === set.size;
  }

  /** A.isSubset(B) => AはBの部分集合かどうか */
  isSubset(set: SetEx<T>): boolean {
    const self = this as unknown as SetEx<T>;
    return self.difference(set).size === 0;
  }

  /** A.isSuperset(B) => AはBの超集合かどうか */
  isSuperset(set: SetEx<T>): boolean {
    const self = this as unknown as SetEx<T>;
    return set.difference(self).size === 0;
  }
}
export default SetEx;
