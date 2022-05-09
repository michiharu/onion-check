[onion-check](README.md) / Exports

# onion-check

## Table of contents

### Type aliases

- [ErrorResult](modules.md#errorresult)
- [RuleDef](modules.md#ruledef)

### Functions

- [config](modules.md#config)
- [createValidator](modules.md#createvalidator)

## Type aliases

### ErrorResult

Ƭ **ErrorResult**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `code` | `string` |
| `label?` | `string` |
| `path` | (`string` \| `number`)[] |
| `rule` | { `name`: `string` ; `value`: `any`  } |
| `rule.name` | `string` |
| `rule.value` | `any` |
| `value` | `unknown` |

#### Defined in

[types/check.ts:21](https://github.com/michiharu/onion-check/blob/7db64da/src/types/check.ts#L21)

___

### RuleDef

Ƭ **RuleDef**<`T`\>: `T` extends `boolean` ? `BooleanRuleDef` : `T` extends `number` ? `NumberRuleDef` : `T` extends `bigint` ? `BigIntRuleDef` : `T` extends `string` ? `StringRuleDef` : `T` extends infer E[] ? `ArrayRuleDef`<`E`\> : `T` extends `object` ? `ObjectRuleDef`<`T`\> : `IgnoreRuleDef`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `any` |

#### Defined in

[types/rule-def.ts:74](https://github.com/michiharu/onion-check/blob/7db64da/src/types/rule-def.ts#L74)

## Functions

### config

▸ **config**(`conf`): `Object`

## Configure a default rule

```typescript
import { config, RuleDef } from 'onion-check';

const commonRules = {
  existence: {
    disallowUndefined: true,
    disallowNokey: true,
  };
};

const onion = config(commonRules);

type DataA = { ... }
const ruleA: RuleDef<DataA> = { ... };
const validatorA = onion.createValidator(ruleA);

type DataB = { ... }
const ruleB: RuleDef<DataB> = { ... };
const validatorB = onion.createValidator(ruleB);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `conf` | `DefaultRules` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `createValidator` | <T\>(`ruleDef`: [`RuleDef`](modules.md#ruledef)<`T`\>, `defaultRules`: `DefaultRules`) => { `check`: `Check`<`T`\> ; `target`: `Target`<`T`\>  } |

#### Defined in

[main.ts:138](https://github.com/michiharu/onion-check/blob/7db64da/src/main.ts#L138)

___

### createValidator

▸ **createValidator**<`T`\>(`ruleDef`, `defaultRules?`): `Object`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `ruleDef` | [`RuleDef`](modules.md#ruledef)<`T`\> |
| `defaultRules` | `DefaultRules` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `check` | `Check`<`T`\> |
| `target` | `Target`<`T`\> |

#### Defined in

[main.ts:77](https://github.com/michiharu/onion-check/blob/7db64da/src/main.ts#L77)
