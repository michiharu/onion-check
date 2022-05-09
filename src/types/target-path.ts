type Value<T extends Record<string, any>> = T[keyof T];

export type TargetPath<T> = T extends (infer E)[]
  ?
      | [number] //
      | [number, ...TargetPath<E>]
  : T extends object
  ? Value<{
      [key in keyof T]:
        | [key] //
        | (T[key] extends object | [] ? [key, ...TargetPath<T[key]>] : never);
    }>
  : never;

export type TargetType<T, P> = //
  T extends (infer E)[]
    ? P extends [number, ...infer Tail]
      ? TargetType<E, Tail>
      : T
    : T extends object
    ? P extends [infer Head, ...infer Tail]
      ? Head extends keyof T
        ? TargetType<T[Head], Tail>
        : never
      : T
    : T;
