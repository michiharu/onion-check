export type Merge<T extends Record<string, any>> = { [K in keyof T]: T[K] };
