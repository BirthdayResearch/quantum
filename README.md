[![CI](https://github.com/WavesHQ/bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/WavesHQ/bridge/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/WavesHQ/bridge/branch/main/graph/badge.svg?token=OXLL8IBZQV)](https://codecov.io/gh/WavesHQ/bridge)

# [DeFiChain Bridge](https://bridge.defichain.com)

> https://bridge.defichain.com

[![Netlify Status](https://api.netlify.com/api/v1/badges/4eaec04e-1416-4c65-843e-d7413fb81d2c/deploy-status)](https://app.netlify.com/sites/defichain-erc20-bridge/deploys)

DeFiChain ERC-20 Bridge

TODO

## Deployed Smart Contracts on Goerli testnet

## Deploy ERC20 tokens 'MUSDT' & 'MUSDC'

To deploy ERC20 token user will have to run a command `npx hardhat run --network goerli ./scripts/deployERC20.ts` in smartContract directory.

To verify the said tokens and other contracts, there would be a prompt on terminal after running the deployment command that devs will need to run after.

Devs need to deploy the `BridgeV1` contract contract before the `BridgeProxy`.

`BridgeV1` can be deployed with the command `npx hardhat run --network goerli ./scripts/deployBridgeImplementation.ts`

`BridgeProxy` can be deployed with `npx hardhat run --network goerli ./scripts/deployBridgeProxy.ts`

Before running the above command, following `vars` need to be addressed:
`ADMIN_ADDRESS`, `OPERATIONAL_ADDRESS`, `RELAYER_ADDRESS`, `TRANSACTION_FEE` & `BRIDGE_IMPLEMENTATION_ADDRESS` aka `BridgeV1` contract address.

### MUSDT

MUSDT Contract address: [0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF](https://goerli.etherscan.io/address/0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF)

### MUSDC

MUSDC Contract address: [0xB200af2b733B831Fbb3d98b13076BC33F605aD58](https://goerli.etherscan.io/address/0xB200af2b733B831Fbb3d98b13076BC33F605aD58)

### BridgeV1

BridgeV1 Contract address: [0xE029B5156c2e597c72f7c8D279411e1fD9a30126](https://goerli.etherscan.io/address/0xE029B5156c2e597c72f7c8D279411e1fD9a30126)

### BridgeProxy

BridgeProxy Contract addrress: [0x93fE70235854e7c97A5db5ddfC6eAAb078e99d3C](https://goerli.etherscan.io/address/0x93fE70235854e7c97A5db5ddfC6eAAb078e99d3C)
