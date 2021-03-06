import { createValidator } from './main';
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
} from './types/type-test';

describe('setRule()', () => {
  describe('TestBool', () => {
    const rule = createValidator<TestBool>({ type: 'boolean', eq: true });
    test('OK', () => {
      const value = true;
      const errors = [];
      expect(rule.check(value).errors()).toEqual(errors);
    });
    test('NG', () => {
      const value = false;
      const errors = [
        {
          code: 'eq',
          label: undefined,
          path: [],
          value,
          rule: { name: 'eq', value: true },
        },
      ];
      expect(rule.check(value).errors()).toEqual(errors);
    });
  });
  describe('TestNum', () => {
    const rule = createValidator<TestNum>({ type: 'number', gt: 3 });
    test('OK', () => {
      const value = 5;
      const errors = [];
      expect(rule.check(value).errors()).toEqual(errors);
    });
    test('NG', () => {
      const value = 1;
      const errors = [
        {
          code: 'gt',
          label: undefined,
          path: [],
          value,
          rule: { name: 'gt', value: 3 },
        },
      ];
      expect(rule.check(value).errors()).toEqual(errors);
    });
  });
  describe('TestStr', () => {
    const rule = createValidator<TestStr>({ type: 'string', oneOf: ['good', 'cool'] });
    test('OK', () => {
      const value = 'good';
      const errors = [];
      expect(rule.check(value).errors()).toEqual(errors);
    });
    test('NG', () => {
      const value = 'marvelous';
      const errors = [
        {
          code: 'oneOf',
          label: undefined,
          path: [],
          value,
          rule: { name: 'oneOf', value: ['good', 'cool'] },
        },
      ];
      expect(rule.check(value).errors()).toEqual(errors);
    });
  });
  describe('TestStrArray', () => {
    const rule = createValidator<TestStrArray>({
      type: 'array',
      elements: { type: 'string', lt: '2022-05-08' },
    });
    test('OK', () => {
      const value = ['2022-04-01', '2022-05-01'];
      const errors = [];
      expect(rule.check(value).errors()).toEqual(errors);
    });
    test('NG', () => {
      const value = ['2022-04-30', '2022-05-30'];
      const errors = [
        {
          code: 'lt',
          label: undefined,
          path: [1],
          value: '2022-05-30',
          rule: { name: 'lt', value: '2022-05-08' },
        },
      ];
      expect(rule.check(value).errors()).toEqual(errors);
    });
  });
  describe('TestNestedArray', () => {
    const rule = createValidator<TestNestedArray>({
      type: 'array',
      elements: {
        type: 'array',
        elements: {
          type: 'number',
          le: 100,
        },
      },
    });
    test('OK', () => {
      const value = [
        [97, 98],
        [99, 100],
      ];
      const errors = [];
      expect(rule.check(value).errors()).toEqual(errors);
    });
    test('NG', () => {
      const value = [
        [98, 99],
        [100, 101],
      ];
      const errors = [
        {
          code: 'le',
          label: undefined,
          path: [1, 1],
          value: 101,
          rule: { name: 'le', value: 100 },
        },
      ];
      expect(rule.check(value).errors()).toEqual(errors);
    });
  });
  describe('TestObj', () => {
    const rule = createValidator<TestObj>({
      type: 'object',
      disallowUndefinedKeys: true,
      keys: {
        bool: { type: 'boolean' },
        num: { type: 'number' },
        str: { type: 'string' },
      },
    });
    test('OK', () => {
      const value = {
        bool: true,
        num: 1,
      };
      const errors = [];
      expect(rule.check(value).errors()).toEqual(errors);
    });
    test('NG', () => {
      const value = {
        bool: true,
        num: 1,
        str: 'string',
        big: 1n,
      };
      const errors = [
        {
          code: 'disallowUndefinedKeys',
          label: undefined,
          path: [],
          value,
          rule: { name: 'disallowUndefinedKeys', value: true },
        },
      ];
      expect(rule.check(value).errors()).toEqual(errors);
    });
  });
  describe('TestNestedObj', () => {
    const rule = createValidator<TestNestedObj>({
      type: 'object',
      disallowUndefinedKeys: true,
      keys: {
        obj: {
          type: 'object',
          disallowUndefinedKeys: true,
          keys: {
            bool: { type: 'boolean' },
            num: { type: 'number' },
          },
        },
      },
    });
    test('OK', () => {
      const value = {
        obj: {
          bool: true,
          num: 1,
        },
      };
      const errors = [];
      expect(rule.check(value).errors()).toEqual(errors);
    });
    test('NG', () => {
      const value = {
        obj: {
          bool: true,
          num: 1,
          str: 'string',
        },
      };
      const errors = [
        {
          code: 'disallowUndefinedKeys',
          label: undefined,
          path: ['obj'],
          value: {
            bool: true,
            num: 1,
            str: 'string',
          },
          rule: { name: 'disallowUndefinedKeys', value: true },
        },
      ];
      expect(rule.check(value).errors()).toEqual(errors);
    });
  });
  describe('TestComplex1', () => {
    const rule = createValidator<TestComplex1>({
      type: 'array',
      length: {
        or: [{ eq: 0 }, { eq: 2 }],
      },
      elements: {
        type: 'object',
        keys: {
          bool: { type: 'boolean' },
          num: { type: 'number' },
        },
      },
    });
    test('OK', () => {
      const value = [
        { bool: true, num: 1 },
        { bool: false, num: 2 },
      ];
      const errors = [];
      expect(rule.check(value).errors()).toEqual(errors);
    });
    test('NG', () => {
      const value = [{ bool: true, num: 1 }];
      const errors = [
        {
          code: 'eq',
          label: undefined,
          path: ['length'],
          value: 1,
          rule: { name: 'eq', value: 0 },
        },
        {
          code: 'eq',
          label: undefined,
          path: ['length'],
          value: 1,
          rule: { name: 'eq', value: 2 },
        },
      ];
      expect(rule.check(value).errors()).toEqual(errors);
    });
  });
  describe('TestComplex2', () => {
    const rule = createValidator<TestComplex2>({
      type: 'object',
      keys: {
        obj: {
          type: 'array',
          elements: {
            type: 'object',
            keys: {
              bool: { type: 'boolean' },
              num: { type: 'number', ne: 0 },
            },
          },
        },
      },
    });
    test('OK', () => {
      const value = {
        obj: [
          { bool: true, num: 1 },
          { bool: false, num: 2 },
        ],
      };
      const errors = [];
      expect(rule.check(value).errors()).toEqual(errors);
    });
    test('NG', () => {
      const value = {
        obj: [
          { bool: true, num: 1 },
          { bool: false, num: 0 },
        ],
      };
      const errors = [
        {
          code: 'ne',
          label: undefined,
          path: ['obj', 1, 'num'],
          value: 0,
          rule: { name: 'ne', value: 0 },
        },
      ];
      expect(rule.check(value).errors()).toEqual(errors);
    });
  });
});
