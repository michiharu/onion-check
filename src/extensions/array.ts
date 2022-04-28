export {};
// 注意: 拡張メソッドを使用する場合はimportします
declare global {
  interface Array<T> {
    set(): Set<T>;
  }
}

Array.prototype.set = function <T>(): Set<T> {
  const self = this as T[];
  return new Set(self);
};
