
export type TestBool = boolean;

export type TestNum = number;

export type TestStr = string;

export type TestStrArray = string[];

export type TestNestedArray = number[][];

export type TestObj = { bool: boolean; num: number; str?: string };

export type TestNestedObj = { obj: { bool: boolean; num: number } };

export type TestComplex1 = { bool: boolean, num: number }[];

export type TestComplex2 = { obj: { bool: boolean; num: number }[] };

export const assertEqualType = <A, B>(expect: [A] extends [B] ? ([B] extends [A] ? true : false) : false) => {};
