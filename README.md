# Medici Contracts

The Medici Safe is a gnosis-safe wallet used by Dialectic. This repository contains modules to provide functionality
required by the Dialectic team.

For further details check out the following articles:
 - [Medici: Dialectic’s Yield Farmer
](https://dialectic.ch/editorial/medici-dialectics-yield-farmer)
 - [Chronograph: Institutional Grade Yield Farming
](https://dialectic.ch/editorial/chronograph-overview)

The backend infrastructure can be found [here](https://github.com/dialecticch/medici-go-demo).

## Overview

The Medici system is designed to allow bots to harvest yield on behalf of a [Gnosis Safe](https://safe.global/), this provides the ability to maintain a secure smart contract wallet without having to collect signatures for harvesting of yield.

As it is designed, every Medici strategy is a [Safe Module](https://docs.safe.global/learn/safe-core/safe-core-protocol/modules-1), these need to be approved by the owner. Withdrawing and depositing can be done by special user roles, this means we also don't need to collect signatures from all owners for this. Funds never leave the custody of the Safe, and therefore this will never result in a loss, except if a malicious or broken strategy is approved.

Upon harvesting, the yield is directly swapped into stablecoins and deposited into the safe. The swapping occurs through 1inch, ensuring best price settlement. The off-chain system finds the best prices and passes this data on-chain during execution. The [harvest test](https://github.com/dialecticch/medici-contracts-demo/blob/master/test/shared/harvest.ts) should provide a little more clarity on how this works.

## Development

### Dependencies

Before running any command, you need to create a `.env` file. You can use the `.example.env` as a starting point.

Then, proceed with installing dependencies:

```sh
npm install
```

### Compile and generate artifacts

Compile contracts and generate Typechain bindings with Hardhat:

```sh
npm run build
```

### Format and lint

Format contracts with `prettier`:

```sh
npm run fmt
```

Lint contracts with `solhint`:

```sh
npm run lint
```

### Run tests

Run the testing suite:

```sh
npm run test
```

Run tests with coverage:

```sh
npm run coverage
```
