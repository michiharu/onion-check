import { check } from './check';
import structuredCopy from './structured-copy';
import { DefaultRules, RuleDef } from './types/rule-def';
import { TargetPath } from './types/target-path';
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

const checkEntry =
  <T>(rule: RuleDef<T>, path: (string | number)[] = []) =>
  (value: T) => {
    const errors = check({
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
  <T>(rule: RuleDef<T>) =>
  (...p: TargetPath<T>) => {
    const path = p as (string | number)[];
    const targetRule = getTargetRule(rule, path);
    return { check: checkEntry(targetRule, path) };
  };

export const setRule = <T>(ruleDef: RuleDef<T>, defaultRules: DefaultRules = {}) => {
  // TODO: ts-jest doesn't have a structuredClone().
  // const rule = applyDefaultRulesToRuleDef(structuredClone(ruleDef), defaultRules) as RuleDef<T>;
  const rule = applyDefaultRulesToRuleDef(structuredCopy(ruleDef), defaultRules) as RuleDef<T>;
  if (rule.type === 'array' || rule.type === 'object') {
    return {
      check: checkEntry<T>(rule),
      target: target(rule),
    };
  }
  return {
    check: checkEntry<T>(rule),
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

const setRuleFromConfig =
  (conf: DefaultRules) =>
  <T>(ruleDef: RuleDef<T>, defaultRules: DefaultRules = {}) =>
    setRule(ruleDef, applyConfigToDefaultRules(conf, defaultRules));

export const config = (conf: DefaultRules) => {
  if (typeof conf !== 'object')
    throw new Error('The config function takes an config object as an argument.');
  return { setRule: setRuleFromConfig(conf) };
};

export default { config, setRule };
