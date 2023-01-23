[![CI](https://github.com/WavesHQ/bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/WavesHQ/bridge/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/WavesHQ/bridge/branch/main/graph/badge.svg?token=OXLL8IBZQV)](https://codecov.io/gh/WavesHQ/bridge)

# [DeFiChain Bridge](https://bridge.defichain.com)

> https://bridge.defichain.com

[![Netlify Status](https://api.netlify.com/api/v1/badges/4eaec04e-1416-4c65-843e-d7413fb81d2c/deploy-status)](https://app.netlify.com/sites/defichain-erc20-bridge/deploys)

## DeFiChain ERC-20 Bridge

### All smart contracts will be deployed on Goerli testnet.

### How to get ether on a testnet to make testnet transactions?

Users can get the GoerliETH via Goerli Faucet(https://goerlifaucet.com/)

### How to get ERC20 tokens to test bridging functionality?

Ideally, we will have multiple Test tokens available. Users will be able to mint tokens by calling the `mint()` function with the respective EOA (Externally Owned Account) or contract address and amount.

### When bridging to DeFiChain, what is the event that devs need to listen to, and what is the payload of that event?

On bridging to the DeFiChain, the event `BRIDGE_TO_DEFI_CHAIN(bytes defiAddress, address indexed tokenAddress, uint256 indexed amount , uint256 indexed timestamp);` will be emitted along with the user's defiAddress, the ERC20 token's address that is being bridged, the amount of the token being bridged, and the timestamp of the transaction.

### When bridging from DeFiChain, what is the expected signed message?

Expected message should be similar to `0x9a2618a0503cf675a85e4519fc97890fba5b851d15e02b8bc8f351d22b46580059c03992465695e89fc29e528797972d05de0b34768d5d3d7f772f2422eb9af01b == relayerAddress._signTypedData(domainData, eip712Types, eip712Data)`. This data is singed by the relayer address. Data that hasn't signed by the relayer address will revert with the error `FAKE_SIGNATURE`.

### Sample metamask transaction of claim transaction?

TODO

### General explanation on how the contract works from an EVM perspective?

TODO

## Operational Transactions

To change state of any smart contract, user need to approve the smart contract with the respected token via `approve()` function first. Once approved, user will be able to bridge the token over to DefiChain.

### Fund ERC20 tokens - to transfer ERC20 tokens from an EOA to the Bridge

Once approved, user will call the `bridgeToDeFiChain()` function with following arguments: `_defiAddress`- address on Defi Chain that receiving funds, `_tokenAddress` - ERC20 token's address and `_amount` amount to bridge over to Defi chain.

### Fund Ether - to transfer ERC20 tokens from an EOA to the Bridge

When sending ETHER to bridge, the user will not have to approve the contract. By default, every smart contract accepts ETH. Sending ether will be similar to ERC20, except we don't account for `_amount`, instead `msg.value()` is used. The `_defiAddress` is the address on the Defi Chain that is receiving funds. The `_tokenAddress` for ETH does not have an address, as it is a native currency, it should be address(0)/0x0.

### Add supported token

Only addresses with Admin and operational role can call the `addSupportedTokens()` function. Admin sets the `_dailyAllowance`.
User should not allow to bridge more than the dailyAllowance/day.

### Remove supported token

Only addresses with Admin and operational role can call the `removeSupportedTokens()` function.

### Withdraw ether

Only the Admin can call the `withdrawEth()` function with ETH's amount.

### Withdraw ERC20

Only the Admin can call the `withdraw()` function with the token's address and amount.

### Change Daily Allowance

Both the Admin and Operational addresses can change the `_dailyAllowance` (the new daily allowance) and `_newResetTimeStamp` (the timestamp when the token will start being supported) via `changeDailyAllowance()` function. The allowance period stays true until it passes 24 hours since it was changed, during this time no bridging to Defi will be allowed.

### Withdraw / withdrawEth

`withdraw()` and `withdrawEth()` functions when called will withdraw ERC20 token and ETHER respectively. Only address with admin role can call these functions.

### Change relayer address

Both the Admin and Operational addresses can change `relayerAddress`.
The relayer address will primarily be used for verifying the signature that is signed by the server. The server will need to sign with the corresponding private key of the relayer address.

### Transaction fee change

Only address with admin role can change `transactionFee`. Initial fee will be set to 0.3%. This means that if the user bridges `X` tokens, he will only bridge 99.7% of X. The other 0.3% will be taken as fees.

### Modify admin and operational address

`grantRole` and `revokeRole` will be used to a grant role to new addresses and revoke the existing addresses role respectively.

## Deployed Smart Contracts on Goerli testnet

## Deploy ERC20 tokens 'MUSDT' & 'MUSDC'

To deploy ERC20 token user will have to run a command `npx hardhat run --network goerli ./scripts/deployERC20.ts` in smartContract directory.

To verify the said tokens and other contracts, there would be a prompt on terminal after running the deployment command that devs will need to run after.

Devs need to deploy the `BridgeV1` implementation contract before the `BridgeProxy`.

`BridgeProxy` should only need to be deployed _once_ to a blockchain. Subsequent deployments should only be deploying the implementation contract (`BridgeV2`, `BridgeV3`, etc), before calling `_upgradeTo` of the `BridgeProxy` contract.

This follows the [proxy pattern](https://blog.openzeppelin.com/proxy-patterns/), with the behaviour being inherited from `OpenZeppelin` proxy contracts.

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
