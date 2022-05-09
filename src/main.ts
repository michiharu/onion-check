import { checkByType } from './check';
import structuredCopy from './structured-copy';
import { Check, Target } from './types/main';
import { DefaultRules, RuleDef } from './types/rule-def';
import { getType, objectKeys } from './util';

const applyDefaultRulesToRuleDef = <T>(r: RuleDef<T>, conf: DefaultRules): RuleDef<T> => {
  const rule = structuredCopy(r);
  if (rule.type === 'ignore') return rule;
  if (conf.existence) {
    objectKeys(conf.existence).forEach((key) => {
      if (rule[key] !== undefined) (rule[key] as unknown) = conf.existence[key];
    });
  }
  if (rule.type === 'array') {
    if (conf.array) {
      objectKeys(conf.array).forEach((key) => {
        if (rule[key] !== undefined) (rule[key] as unknown) = conf.array[key];
      });
    }
    rule.elements = applyDefaultRulesToRuleDef(rule.elements, conf);
    return rule;
  }
  if (rule.type === 'object') {
    if (conf.object) {
      objectKeys(conf.object).forEach((key) => {
        if (rule[key] !== undefined) (rule[key] as unknown) = conf.object[key];
      });
    }
    Object.keys(rule.keys).forEach((key) => {
      rule.keys[key] = applyDefaultRulesToRuleDef<any>(rule.keys[key], conf);
    });
    return rule;
  }
  return rule;
};

const check =
  <T>(rule: RuleDef<T>, path: (string | number)[] = []): Check<T> =>
  (value) => {
    const errors = checkByType({
      rule,
      type: getType(value),
      value,
      path,
    });
    return {
      isSuccess: () => errors.length === 0,
      isFailure: () => errors.length !== 0,
      errors: () => errors,
    };
  };

const getNextRule = <T>(rule: RuleDef<T>, path: (string | number)[]) => {
  if (rule.type === 'array') return rule.elements;
  if (rule.type === 'object') return rule.keys[path[0]];
  return undefined;
};

const getTargetRule = <T>(rule: RuleDef<T>, path: (string | number)[]) => {
  const next = getNextRule(rule, path);
  if (!next) throw new Error();
  if (path.length === 1) {
    return next;
  }
  return getTargetRule(next, path.slice(1));
};

const target =
  <T>(rule: RuleDef<T>): Target<T> =>
  (...p) => {
    const path = p as (string | number)[];
    const targetRule = getTargetRule(rule, path);
    return { check: check(targetRule, path) };
  };

export const createValidator = <T>(ruleDef: RuleDef<T>, defaultRules: DefaultRules = {}) => {
  // TODO: ts-jest doesn't have a structuredClone().
  // const rule = applyDefaultRulesToRuleDef(structuredClone(ruleDef), defaultRules) as RuleDef<T>;
  const rule = applyDefaultRulesToRuleDef(structuredCopy(ruleDef), defaultRules) as RuleDef<T>;
  return {
    check: check(rule),
    target: target(rule),
  };
};

const applyConfigToDefaultRules = (
  conf: DefaultRules,
  defaultRules: DefaultRules
): DefaultRules => {
  const result: DefaultRules = {
    existence: {},
    object: {},
  };
  objectKeys(conf).forEach((rules) => {
    objectKeys(conf[rules]).forEach((rule) => {
      result[rules][rule] = conf[rules][rule];
    });
  });
  objectKeys(defaultRules).forEach((rules) => {
    objectKeys(defaultRules[rules]).forEach((rule) => {
      result[rules][rule] = defaultRules[rules][rule];
    });
  });
  return result;
};

const createValidatorFromConfig =
  (conf: DefaultRules) =>
  <T>(ruleDef: RuleDef<T>, defaultRules: DefaultRules = {}) =>
    createValidator(ruleDef, applyConfigToDefaultRules(conf, defaultRules));

/**
 * ## Configure a default rule
 *
 * ```typescript
 * import { config, RuleDef } from 'onion-check';
 *
 * const commonRules = {
 *   existence: {
 *     disallowUndefined: true,
 *     disallowNokey: true,
 *   };
 * };
 *
 * const onion = config(commonRules);
 *
 * type DataA = { ... }
 * const ruleA: RuleDef<DataA> = { ... };
 * const validatorA = onion.createValidator(ruleA);
 *
 * type DataB = { ... }
 * const ruleB: RuleDef<DataB> = { ... };
 * const validatorB = onion.createValidator(ruleB);
 * ```
 *
 */
export const config = (conf: DefaultRules) => {
  if (typeof conf !== 'object')
    throw new Error('The config function takes an config object as an argument.');
  return { createValidator: createValidatorFromConfig(conf) };
};
