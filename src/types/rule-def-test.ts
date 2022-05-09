import {
  ArrayRuleDef,
  BooleanRuleDef,
  Conditional,
  NumberRuleDef,
  NumberRules,
  RuleDef,
  StringRuleDef,
} from './rule-def';
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

type ResultBool = RuleDef<TestBool>;
assertEqualType<ResultBool, BooleanRuleDef>(true);

type ResultNum = RuleDef<TestNum>;
assertEqualType<ResultNum, NumberRuleDef>(true);

type ResultStr = RuleDef<TestStr>;
assertEqualType<ResultStr, StringRuleDef>(true);

type ResultStrArray = RuleDef<TestStrArray>;
assertEqualType<ResultStrArray, ArrayRuleDef<string>>(true);

type ExpectNestedArray = {
  type: 'array';
  typeErrorCode?: string;
  label?: string;
  required?: boolean;
  disallowUndefined?: boolean;
  disallowNull?: boolean;
  disallowNokey?: boolean;
  requiredErrorCode?: string;
  disallowUndefinedErrorCode?: string;
  disallowNullErrorCode?: string;
  disallowNokeyErrorCode?: string;
  length?: Conditional<NumberRules>;
  elements: {
    type: 'array';
    typeErrorCode?: string;
    label?: string;
    required?: boolean;
    disallowUndefined?: boolean;
    disallowNull?: boolean;
    disallowNokey?: boolean;
    requiredErrorCode?: string;
    disallowUndefinedErrorCode?: string;
    disallowNullErrorCode?: string;
    disallowNokeyErrorCode?: string;
    length?: Conditional<NumberRules>;
    elements: NumberRuleDef;
  };
};
type ResultNestedArray = RuleDef<TestNestedArray>;
assertEqualType<ResultNestedArray, ExpectNestedArray>(true);

type ExpectObj = {
  type: 'object';
  typeErrorCode?: string;
  label?: string;
  required?: boolean;
  disallowUndefined?: boolean;
  disallowNull?: boolean;
  disallowNokey?: boolean;
  requiredErrorCode?: string;
  disallowUndefinedErrorCode?: string;
  disallowNullErrorCode?: string;
  disallowNokeyErrorCode?: string;
  disallowUndefinedKeys?: boolean;
  disallowUndefinedKeysErrorCode?: string;
  keys: {
    bool: BooleanRuleDef;
    num: NumberRuleDef;
    str: StringRuleDef;
  };
};
type ResultObj = RuleDef<TestObj>;
assertEqualType<ResultObj, ExpectObj>(true);

type ExpectNestedObj = Omit<ExpectObj, 'keys'> & {
  keys: {
    obj: {
      type: 'object';
      typeErrorCode?: string;
      label?: string;
      required?: boolean;
      disallowUndefined?: boolean;
      disallowNull?: boolean;
      disallowNokey?: boolean;
      requiredErrorCode?: string;
      disallowUndefinedErrorCode?: string;
      disallowNullErrorCode?: string;
      disallowNokeyErrorCode?: string;
      disallowUndefinedKeys?: boolean;
      disallowUndefinedKeysErrorCode?: string;
      keys: {
        bool: BooleanRuleDef;
        num: NumberRuleDef;
      };
    };
  };
};
type ResultNestedObj = RuleDef<TestNestedObj>;
assertEqualType<ResultNestedObj, ExpectNestedObj>(true);

type ExpectComplex1 = {
  type: 'array';
  typeErrorCode?: string;
  label?: string;
  required?: boolean;
  disallowUndefined?: boolean;
  disallowNull?: boolean;
  disallowNokey?: boolean;
  requiredErrorCode?: string;
  disallowUndefinedErrorCode?: string;
  disallowNullErrorCode?: string;
  disallowNokeyErrorCode?: string;
  length?: Conditional<NumberRules>;
  elements: {
    type: 'object';
    typeErrorCode?: string;
    label?: string;
    required?: boolean;
    disallowUndefined?: boolean;
    disallowNull?: boolean;
    disallowNokey?: boolean;
    requiredErrorCode?: string;
    disallowUndefinedErrorCode?: string;
    disallowNullErrorCode?: string;
    disallowNokeyErrorCode?: string;
    disallowUndefinedKeys?: boolean;
    disallowUndefinedKeysErrorCode?: string;
    keys: {
      bool: BooleanRuleDef;
      num: NumberRuleDef;
    };
  };
};
type ResultComplex1 = RuleDef<TestComplex1>;
assertEqualType<ResultComplex1, ExpectComplex1>(true);

type ExpectComplex2 = {
  type: 'object';
  typeErrorCode?: string;
  label?: string;
  required?: boolean;
  disallowUndefined?: boolean;
  disallowNull?: boolean;
  disallowNokey?: boolean;
  requiredErrorCode?: string;
  disallowUndefinedErrorCode?: string;
  disallowNullErrorCode?: string;
  disallowNokeyErrorCode?: string;
  disallowUndefinedKeys?: boolean;
  disallowUndefinedKeysErrorCode?: string;
  keys: {
    obj: {
      type: 'array';
      typeErrorCode?: string;
      label?: string;
      required?: boolean;
      disallowUndefined?: boolean;
      disallowNull?: boolean;
      disallowNokey?: boolean;
      requiredErrorCode?: string;
      disallowUndefinedErrorCode?: string;
      disallowNullErrorCode?: string;
      disallowNokeyErrorCode?: string;
      length?: Conditional<NumberRules>;
      elements: {
        type: 'object';
        typeErrorCode?: string;
        label?: string;
        required?: boolean;
        disallowUndefined?: boolean;
        disallowNull?: boolean;
        disallowNokey?: boolean;
        requiredErrorCode?: string;
        disallowUndefinedErrorCode?: string;
        disallowNullErrorCode?: string;
        disallowNokeyErrorCode?: string;
        disallowUndefinedKeys?: boolean;
        disallowUndefinedKeysErrorCode?: string;
        keys: {
          bool: BooleanRuleDef;
          num: NumberRuleDef;
        };
      };
    };
  };
};
type ResultComplex2 = RuleDef<TestComplex2>;
assertEqualType<ResultComplex2, ExpectComplex2>(true);
