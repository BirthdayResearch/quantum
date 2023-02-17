[![CI](https://github.com/WavesHQ/bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/WavesHQ/bridge/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/WavesHQ/bridge/branch/main/graph/badge.svg?token=OXLL8IBZQV)](https://codecov.io/gh/WavesHQ/bridge)

# [Quantum Bridge](https://quantumbridge.app)

> https://quantumbridge.app

[![Netlify Status](https://api.netlify.com/api/v1/badges/4eaec04e-1416-4c65-843e-d7413fb81d2c/deploy-status)](https://app.netlify.com/sites/defichain-erc20-bridge/deploys)

## Quantum Bridge

All smart contracts will be deployed on Goerli testnet for testing purposes.

### How to get ether on a testnet to make testnet transactions?

Users can get the GoerliETH via Goerli Faucet(https://goerlifaucet.com/)

### How to get ERC20 tokens to test bridging functionality?

The MUSDT and MUSDC contract have been deployed on Goerli for testing. Users will be able to mint tokens by calling the `mint()` function with the respective EOA (Externally Owned Account) or contract address and amount.

### When bridging to DeFiChain, what is the event that devs need to listen to, and what is the payload of that event?

On bridging to the DeFiChain, the event `BRIDGE_TO_DEFI_CHAIN(bytes defiAddress, address indexed tokenAddress, uint256 indexed amount , uint256 indexed timestamp);` will be emitted along with the user's defiAddress, the ERC20 token's address that is being bridged, the amount of the token being bridged, and the timestamp of the transaction.

### When bridging from DeFiChain, what is the expected signed message?

Expected message should be similar to `0x9a2618a0503cf675a85e4519fc97890fba5b851d15e02b8bc8f351d22b46580059c03992465695e89fc29e528797972d05de0b34768d5d3d7f772f2422eb9af01b == relayerAddress._signTypedData(domainData, eip712Types, eip712Data)`. This data is singed by the relayer address. Data that hasn't signed by the relayer address will revert with the error `FAKE_SIGNATURE`.

### Sample metamask transaction of claim transaction?

TODO

### General explanation on how the contract works from an EVM perspective?

TODO

## Operational Transactions

To change the state of any smart contract, users need to approve the smart contract of the respective token via the `approve()` function first. Once approved, user will be able to bridge the token over to DefiChain.

### Bridge ERC20 tokens - to transfer ERC20 tokens from an EOA to the Bridge

Once approved, user will call the `bridgeToDeFiChain()` function with following arguments: `_defiAddress`- address on Defi Chain that receiving funds, `_tokenAddress` - ERC20 token's address and `_amount` amount to bridge over to Defi chain.

### Add supported token

Only addresses with the Admin and Operational roles can call the `addSupportedTokens()` function. This sets the `_tokenCap` for an ERC20 token identified by its `_tokenAddress`. All added tokens will be instantly supported by the bridge.

`_tokenCap` represent the maximum balance of tokens the contract can hold per `_tokenAddress`

### Remove supported token

Only addresses with the Admin and Operational role can call the `removeSupportedTokens()` function. This also sets the `_tokenCap` to `0`.

### Withdraw

`withdraw()` function when called will withdraw an ERC20 token. Only the address with the Admin role can call this function.

### FlushFund

`flushFund` function to flush the excess funds `(token.balanceOf(Bridge) - tokenCap)` across supported tokens to a hardcoded address (`flushReceiveAddress`) anyone can call this function.

### Change Flush Receive Address

Both the Admin and Operational addresses can change `flushReceiveAddress`.
`changeFlushReceiveAddress` function will reset the `flushReceiveAddress` to new address.

### Change relayer address

Both the Admin and Operational addresses can change `relayerAddress`.

The relayer address will primarily be used for verifying the signature that is signed by the server. The server will need to sign with the corresponding private key of the relayer address.

### Transaction fee change

Only addresses with admin roles can change `transactionFee`.

Initial fee will be set to 0.1%. This means that if the user bridges `X` tokens, 99.9% of X will be bridged. The other 0.1% will be taken as fees and sent to `communityWallet`.

### Change Tx Fee Address

Only addresses with admin roles can change `communityWallet`. This is where the tx fees upon bridging will go.

### Change Token Cap

Only addresses with admin roles can change `tokenCap`.

### Modify admin and operational address

`grantRole` and `revokeRole` will be used to a grant role to new addresses and revoke the existing addresses role respectively.

## Deployed Smart Contracts on Goerli testnet

### Deploy ERC20 tokens 'MUSDT' & 'MUSDC'

To deploy ERC20 tokens user will have to run a command `npx hardhat run --network goerli ./scripts/deployERC20.ts` in smartContract directory.

To verify the said tokens and other contracts, there would be a prompt on terminal after running the deployment command that devs will need to run after.

Devs need to deploy the `BridgeV1` implementation contract before the `BridgeProxy`.

`BridgeProxy` should only need to be deployed _once_ to a blockchain. Subsequent deployments should only be deploying the implementation contract (`BridgeV2`, `BridgeV3`, etc), before calling `_upgradeTo` of the `BridgeProxy` contract.

This follows the [proxy pattern](https://blog.openzeppelin.com/proxy-patterns/), with the behaviour being inherited from `OpenZeppelin` proxy contracts.

`BridgeV1` can be deployed with the command `npx hardhat run --network goerli ./scripts/deployBridgeImplementation.ts`

`BridgeProxy` can be deployed with `npx hardhat run --network goerli ./scripts/deployBridgeProxy.ts`

Before running the above command, following `vars` need to be addressed:
`ADMIN_ADDRESS`, `OPERATIONAL_ADDRESS`, `RELAYER_ADDRESS`, `TRANSACTION_FEE` & `BRIDGE_IMPLEMENTATION_ADDRESS` aka `BridgeV1` contract address.

## Mint and Approve on Goerli Testnet

To Mint the test tokens and Approve the Bridge Contract devs will have to run a command `npx hardhat run --network goerli ./scripts/mintTestToken.ts` in smartContract directory. Script will mint `100_000` tokens.

### MWBTC

MWBTC Contract address: [0xD723D679d1A3b23d0Aafe4C0812f61DDA84fc043](https://goerli.etherscan.io/address/0xd723d679d1a3b23d0aafe4c0812f61dda84fc043)

### MUSDT

MUSDT Contract address: [0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF](https://goerli.etherscan.io/address/0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF)

### MUSDC

MUSDC Contract address: [0xB200af2b733B831Fbb3d98b13076BC33F605aD58](https://goerli.etherscan.io/address/0xB200af2b733B831Fbb3d98b13076BC33F605aD58)

### BridgeV1

BridgeV1 Contract address: [0xB5AA3ba3F4bF825AAF96F1ee9Fa0D6b3702Dc8B6](https://goerli.etherscan.io/address/0xB5AA3ba3F4bF825AAF96F1ee9Fa0D6b3702Dc8B6)

### BridgeProxy

BridgeProxy Contract address: [0x96E5E1d6377ffA08B9c08B066f430e33e3c4C9ef](https://goerli.etherscan.io/address/0x96E5E1d6377ffA08B9c08B066f430e33e3c4C9ef)

## Fund Bridge ERC20 tokens

### Add funds

Anyone can send funds to the bridge contract. Ideally, this should be done by liquidity providers. If there are tokens sent by other addresses to the contract, those tokens will be unaccounted for.

Admins can send ERC20 tokens via the `transfer(address _to, uint256 _amount)` function or utilizing wallets such as Metamask.

### Withdrawing funds

ERC20 tokens can be withdrawn by the Admin address only via the `withdraw(address _tokenAddress, uint256 amount)` function.

## Admin and Operational addresses - Gnosis safe

Admin and Operational addresses will be Gnosis safes, ideally will be with at least 3 owners with a 2/3 quorum.

More admins can be added later, for more info, refer to [Gnosis safe: adding owners](https://help.gnosis-safe.io/en/articles/3950657-add-owners).

## Workflow for generating Prisma Client and applying database migrations

After making changes to the database schema in schema.prisma, run `cd apps/server` in terminal (/bridge).

Run `./with-db generate` to generate the Prisma Client.

Run `./with-db migrate dev` to migrate and apply database migrations in the development environment.
