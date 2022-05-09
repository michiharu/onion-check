import { ErrorResult } from './check';
import { DefaultRules, RuleDef } from './rule-def';
import { TargetPath } from './target-path';

type CheckResult = {
  isSuccess: () => boolean;
  isFailure: () => boolean;
  errors: () => ErrorResult[];
};

export type CheckEntry<T> = (rule: RuleDef<T>, path: (string | number)[]) => Check<T>;
export type Check<T> = (value: T) => CheckResult;

export type Target<T> = (...p: TargetPath<T>) => { check: Check<T> };

export type Validator<T> = {
  check: Check<T>;
  target: Target<T>;
};
export type CreateValidator = <T>(ruleDef: RuleDef<T>, defaultRules: DefaultRules) => Validator<T>;
