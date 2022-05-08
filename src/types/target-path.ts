type Value<T extends Record<string, any>> = T[keyof T];

export type TargetPath<T> = T extends (infer E)[]
  ?
      | [number] //
      | [number, ...TargetPath<E>]
  : T extends Record<string, any>
  ? Value<{
      [key in keyof T]:
        | [key] //
        | (T[key] extends Record<string, any> | [] ? [key, ...TargetPath<T[key]>] : never);
    }>
  : never;
