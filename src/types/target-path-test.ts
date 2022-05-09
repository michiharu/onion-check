import { TargetPath } from './target-path';
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

type ResultNestedArray = TargetPath<TestNestedArray>;
assertEqualType<ResultNestedArray, [number] | [number, number]>(true);

type ResultObj = TargetPath<TestObj>;
assertEqualType<ResultObj, ['bool'] | ['num'] | ['str']>(true);

type ResultNestedObj = TargetPath<TestNestedObj>;
assertEqualType<ResultNestedObj, ['obj'] | ['obj', 'bool'] | ['obj', 'num']>(true);

type ResultComplex1 = TargetPath<TestComplex1>;
assertEqualType<ResultComplex1, [number] | [number, 'bool'] | [number, 'num']>(true);

type ResultComplex2 = TargetPath<TestComplex2>;
assertEqualType<
  ResultComplex2,
  ['obj'] | ['obj', number] | ['obj', number, 'bool'] | ['obj', number, 'num']
>(true);
