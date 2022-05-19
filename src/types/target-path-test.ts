import { TargetPath, TargetType } from './target-path';
import {
  TestBool,
  TestComplex1,
  TestComplex2,
  TestNestedArray,
  TestNestedObj,
  TestNum,
  TestObj,
  TestStr,
  TestStrArray,
  assertEqualType,
} from './type-test';

type ResultBool = TargetPath<TestBool>;
assertEqualType<ResultBool, never>(true);

type ResultNum = TargetPath<TestNum>;
assertEqualType<ResultNum, never>(true);

type ResultStr = TargetPath<TestStr>;
assertEqualType<ResultStr, never>(true);

type ResultStrArray = TargetPath<TestStrArray>;
assertEqualType<ResultStrArray, [number]>(true);

// TestNestedArray
type ResultNestedArray = TargetPath<TestNestedArray>;
assertEqualType<ResultNestedArray, [number] | [number, number]>(true);

type ResultNestedArrayTargetType1 = TargetType<TestNestedArray, [number]>;
assertEqualType<ResultNestedArrayTargetType1, number[]>(true);

type ResultNestedArrayTargetType2 = TargetType<TestNestedArray, [number, number]>;
assertEqualType<ResultNestedArrayTargetType2, number>(true);

// TestObj
type ResultObj = TargetPath<TestObj>;
assertEqualType<ResultObj, ['bool'] | ['num'] | ['str']>(true);

type ResultObjTargetType1 = TargetType<TestObj, ['bool']>;
assertEqualType<ResultObjTargetType1, boolean>(true);

type ResultObjTargetType2 = TargetType<TestObj, ['num']>;
assertEqualType<ResultObjTargetType2, number>(true);

type ResultObjTargetType3 = TargetType<TestObj, ['str']>;
assertEqualType<ResultObjTargetType3, string>(true);

// TestNestedObj
type ResultNestedObj = TargetPath<TestNestedObj>;
assertEqualType<ResultNestedObj, ['obj'] | ['obj', 'bool'] | ['obj', 'num']>(true);

type ResultNestedObjTargetType1 = TargetType<TestNestedObj, ['obj']>;
assertEqualType<ResultNestedObjTargetType1, { bool: boolean; num: number }>(true);

type ResultNestedObjTargetType2 = TargetType<TestNestedObj, ['obj', 'bool']>;
assertEqualType<ResultNestedObjTargetType2, boolean>(true);

type ResultNestedObjTargetType3 = TargetType<TestNestedObj, ['obj', 'num']>;
assertEqualType<ResultNestedObjTargetType3, number>(true);

// TestComplex1
type ResultComplex1 = TargetPath<TestComplex1>;
assertEqualType<ResultComplex1, [number] | [number, 'bool'] | [number, 'num']>(true);

type ResultComplex1TargetType1 = TargetType<TestComplex1, [number]>;
assertEqualType<ResultComplex1TargetType1, { bool: boolean; num: number }>(true);

type ResultComplex1TargetType2 = TargetType<TestComplex1, [number, 'bool']>;
assertEqualType<ResultComplex1TargetType2, boolean>(true);

type ResultComplex1TargetType3 = TargetType<TestComplex1, [number, 'num']>;
assertEqualType<ResultComplex1TargetType3, number>(true);

// TestComplex2
type ResultComplex2 = TargetPath<TestComplex2>;
assertEqualType<
  ResultComplex2,
  ['obj'] | ['obj', number] | ['obj', number, 'bool'] | ['obj', number, 'num']
>(true);

type ResultComplex2TargetType1 = TargetType<TestComplex2, ['obj']>;
assertEqualType<ResultComplex2TargetType1, { bool: boolean; num: number }[]>(true);

type ResultComplex2TargetType2 = TargetType<TestComplex2, ['obj', number]>;
assertEqualType<ResultComplex2TargetType2, { bool: boolean; num: number }>(true);

type ResultComplex2TargetType3 = TargetType<TestComplex2, ['obj', number, 'bool']>;
assertEqualType<ResultComplex2TargetType3, boolean>(true);

type ResultComplex2TargetType4 = TargetType<TestComplex2, ['obj', number, 'num']>;
assertEqualType<ResultComplex2TargetType4, number>(true);
