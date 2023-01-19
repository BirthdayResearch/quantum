# smartcontracts

A package which contains the Ethereum smart contracts for the DeFiChain to Ethereum bridge.

## Setting up local environment

This section outlines how to get started on integrating with the smart contracts for the Bridge on your dApp.
There are many different ways, but this is the simplest and fastest method.

1. In your terminal, run `npx hardhat --config ./src/hardhat.config.ts node` from this package's directory
   - This runs a new Hardhat node locally, listening on `http://127.0.0.1:8545`
2. In another terminal, run `npx hardhat --config ./src/hardhat.config.ts --network localhost setupLocalTestnet`
   - This will deploy the smart contracts to the local Hardhat node that you have started
   - This command will also log out the different contract addresses, and the minted tokens

You're done! Your dApp can now interact with the smart contracts on the local Hardhat node.
