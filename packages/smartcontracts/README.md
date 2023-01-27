# smartcontracts

A package which contains the Ethereum smart contracts for the DeFiChain to Ethereum bridge.

## Deployed Smart Contracts on Hardhat/Local testnet

To deploy the Smart Contracts on local testnet, devs can run the command `npx hardhat run --network hardhat ./scripts/localContractsDeployment.ts`.

This script will deploy all needed contracts. Will mint `100,000` MUSDC and MUSDT token to the user(in this case, accounts[0]).This will also approve the Bridge contract and add test tokens as supported tokens for bridging with maximum daily allowance.

Following addresses will be the admin, operational roles and relayer address.

Admin == accounts[0],

Operational == accounts[1],

Relayer address == accounts[0]

Devs can change these addresses as per their requirements in `../scripts/localContractsDeployment.ts` file.
