import { DeepType, TypeOf, deepTypes } from './types/type-of';

export const objectKeys = <T extends object>(obj: T): (keyof T)[] =>
  Object.keys(obj) as (keyof T)[];

export const getType = (value: unknown): TypeOf => {
  if (value === null) return 'null';
  const deepType: DeepType = Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
  if (deepTypes.includes(deepType)) return deepType;
  if (typeof value === 'object' || typeof value === 'function') return 'object';
  return typeof value;
};

export const getTypeFromParent = (obj: unknown, key: string): TypeOf => {
  const value = obj[key];
  const keySet = new Set(Object.keys(obj));
  if (!keySet.has(key)) return 'nokey';
  return getType(value);
};
