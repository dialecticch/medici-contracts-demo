# Roles

## Require authorization for a call

To authorize a call you can use the `authorized` modifier from `AbstractStrategy`:

```
function a() authorized(ROLE) { ... }
```

where `ROLE` is one of the roles outlined in the Roles Mapping section.

## Available roles

### Global Roles

#### 1 - `Operator` role (`0x1`)

This role is responsible for managing strategies parameters.

**Capabilities**

- Call any configuration method on strategies (eg. `addPoolHelper` in [`VectorSingleSideStrategy`](../contracts/Modules/Strategies/Vector/VectorSingleSideStrategy.sol))

#### 2 - `Strategist` role (`0x2`)

This role is responsible for managing funds deployed in strategies.

**Capabilities**

- Call `deposit` and `withdraw` on strategies.

#### 3 - `Harvester` role (`0x3`)

This role is authorized to execute harvests on every strategy.

**Capabilities**

- Call `harvest` method for every strategy.

#### 4 - `Bridge Admin` role (`0x4`)

This role is authorized to manage the bridge contract.

#### 5 - `Bridge Operator` role (`0x5`)

This role is authorized to call the bridge contract.

### Strategy Specific Roles

#### 65 - `Perp Strategist` role (`0x41`)

This role is responsible for managing funds deployed in perp strategies.
