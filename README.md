# Medici Contracts

The Medici Safe is a gnosis-safe wallet used by Dialectic. This repository contains modules to provide functionality
required by the Dialectic team.

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
