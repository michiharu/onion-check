export const deepTypes = [
  'array',
  'bigint',
  'date',
  'error',
  'function',
  'generatorfunction',
  'generator',
  'regexp',
  'symbol',
] as const;
export type DeepType = typeof deepTypes[number];
const typeOf = (value: unknown) => typeof value;
export type TypeOf = ReturnType<typeof typeOf> | DeepType | 'null' | 'nokey';

export const nullableTypes = ['undefined', 'null', 'nokey'] as const;
export type NullableType = typeof nullableTypes[number];
