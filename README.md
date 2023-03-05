[![CI](https://github.com/WavesHQ/quantum/actions/workflows/ci.yml/badge.svg)](https://github.com/WavesHQ/quantum/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/WavesHQ/quantum/branch/main/graph/badge.svg?token=OXLL8IBZQV)](https://codecov.io/gh/WavesHQ/quantum)

# [Quantum Bridge](https://quantumbridge.app)

> https://quantumbridge.app

[![Netlify Status](https://api.netlify.com/api/v1/badges/4eaec04e-1416-4c65-843e-d7413fb81d2c/deploy-status)](https://app.netlify.com/sites/defichain-erc20-bridge/deploys)

## Quantum Bridge

All smart contracts will be deployed on Goerli testnet for testing purposes.

### How to get ether on a testnet to make testnet transactions?

Users can get the GoerliETH via Goerli Faucet(https://goerlifaucet.com/)

### How to get ERC20 tokens to test bridging functionality?

The MUSDT and MUSDC contract have been deployed on Goerli for testing. Users will be able to mint tokens by calling the `mint()` function with the respective EOA (Externally Owned Account) or contract address and amount.

### When bridging from DeFiChain, what is the expected signed message?

Expected message should be similar to `0x9a2618a0503cf675a85e4519fc97890fba5b851d15e02b8bc8f351d22b46580059c03992465695e89fc29e528797972d05de0b34768d5d3d7f772f2422eb9af01b == relayerAddress._signTypedData(domainData, eip712Types, eip712Data)`. This data is singed by the relayer address. Data that hasn't signed by the relayer address will revert with the error `FAKE_SIGNATURE`.

### Sample metamask transaction of claim transaction?

TODO

### General explanation on how the contract works from an EVM perspective?

TODO

####

To change the state of any smart contract, users need to approve the smart contract of the respective token via the `approve()` function first. Once approved, user will be able to bridge the token over to DefiChain.

We are implementing a TimeLock contract that will work as an Admin address for ADMIN ONLY tx. There will be 3 days delay on every operational tx except when calling `Withdraw()` function, TimeLock contract is not able to call this function.

### TimeLock Contract Account Permission

Gnosis safe will be implemented with both proposers and executors roles. Gnosis Safe has the authority to grant roles to addresses, as long as it holds the corresponding role itself. When revoking privileges, either the revokeRole() or renounceRole() functions must be used.

To execute only Admin transactions, the developer will need to follow these steps:

- First, create a transaction using Safe [guide](<(https://help.safe.global/en/articles/3738081-contract-interactions),>).
- After providing the contract address and ABI, the developer can select the contract method (in this case, we will try to change the transaction fee).
- Select "Schedule". According to the Schedule() function, the following arguments need to be provided: address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt, and uint256 delay.
- The target address is the Proxy Bridge. The value will usually be 0. The data is the encoded data of the function and arguments (BridgeV1Interface.encodeFunctionData('changeTxFee', [100])). Predecessor should almost always be 0x0 unless we have a prerequisite transaction, salt will be in incremented order (e.g., 0x0...1, 0x0...2, 0x0...3, and so on) and delay (in seconds) should be >= `getMinDelay()` which will be set to 3 days.

Salt can be `0x0000000000000000000000000000000000000000000000000000000000000000` for 1st transaction,
`0x0000000000000000000000000000000000000000000000000000000000000001` for 2nd transaction and so on.

The reason behind choosing different salt is to avoid having the same transaction again.

After scheduling the transaction using a timelock, the developer must call the execute() function with the provided arguments(same as above). If the execute() function is called before the specified `delay` time has passed, the transaction will revert with the error message "TimelockController: operation is not ready". This is because the timelock is designed to ensure that the specified delay time has elapsed before the transaction can be executed. Once the delay time has passed, the transaction can be executed normally.

## Operational Transactions

### Bridge Contract Account Permission

There are only two roles: DEFAULT_ADMIN_ROLE and WITHDRAW_ROLE.

The TimeLock contract is assigned the DEFAULT_ADMIN_ROLE, while another Gnosis Safe is assigned the WITHDRAW_ROLE. The DEFAULT_ADMIN_ROLE has the ability to grant both roles to other addresses, but this change will only take effect after three days.

Finally, both addresses can renounce their own roles by calling the renounceRole() function.

### Bridge ERC20 tokens - to transfer ERC20 tokens from an EOA to the Bridge

Once approved, user will call the `bridgeToDeFiChain()` function with following arguments: `_defiAddress`- address on Defi Chain that receiving funds, `_tokenAddress` - ERC20 token's address and `_amount` amount to bridge over to Defi chain.

### Add supported token

Only address with the Admin role can call the `addSupportedTokens()` function. This sets the `_tokenCap` for an ERC20 token and ETH identified by its `_tokenAddress`. All added tokens will be instantly supported by the bridge.

In case of ETH, address(0) will be used as an address.

`_tokenCap` represent the maximum balance of tokens the contract can hold per `_tokenAddress`

### Remove supported token

Only address with the Admin role can call the `removeSupportedTokens()` function. This also sets the `_tokenCap` to `0`.

### Withdraw

`withdraw()` function when called will withdraw an ERC20 token and ETH (address == 0x0). Only the address with the WITHDRAW role can call this function.

### flushMultipleTokenFunds

`flushMultipleTokenFunds(uint256 _fromIndex, uint256 _toIndex)` function to flush the excess funds `(token.balanceOf(Bridge) - tokenCap)` across supported tokens to a hardcoded address (`flushReceiveAddress`) anyone can call this function. For example, calling flushMultipleTokenFunds(0,3), only the tokens at index 0, 1 and 2 will be flushed. This applies to all tokens and ETH.

### flushFundPerToken

`flushFundPerToken(address _tokenAddress)` is doing same as above function, however doing on token basis instead of from and to indexes.

### Change Flush Receive Address

Admin address can change `flushReceiveAddress`.
`changeFlushReceiveAddress` function will reset the `flushReceiveAddress` to new address.

### Change relayer address

Admin address can change `relayerAddress`.

The relayer address will primarily be used for verifying the signature that is signed by the server. The server will need to sign with the corresponding private key of the relayer address.

### Transaction fee change

Only address with Admin role can change `transactionFee`.

Initial fee will be set to 0%. This means that if the user bridges `X` tokens, 100% of X will be bridged to defiChain. If in future, fee > 0, respected amount will be sent to `communityWallet`.

### Change Tx Fee Address

Only address with admin role can change `communityWallet`. This is where the tx fees upon bridging will go.

### Change Token Cap

Only address with admin role can change `tokenCap`.

### Modify admin and operational address

`grantRole` and `revokeRole` will be used to a grant role to new addresses and revoke the existing addresses role respectively. Only Admin address can make these changes.

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

## Mainnet Addresses

### TimeLock

Time lock Contract address: [0xbfe4a2126313bcdc44daf3551b9f22ddda02c937](https://etherscan.io/address/0xbfe4a2126313bcdc44daf3551b9f22ddda02c937)

### BridgeV1

BridgeV1 Contract address: [0x7bdbd5675bad2653cba9bc0e09564dd8d7b53957](https://etherscan.io/address/0x7bdbd5675bad2653cba9bc0e09564dd8d7b53957)

### BridgeProxy

BridgeProxy Contract address: [0x54346d39976629b65ba54eac1c9ef0af3be1921b](https://etherscan.io/address/0x54346d39976629b65ba54eac1c9ef0af3be1921b)

## Testnet Addresses

### MWBTC

MWBTC Contract address: [0xD723D679d1A3b23d0Aafe4C0812f61DDA84fc043](https://goerli.etherscan.io/address/0xd723d679d1a3b23d0aafe4c0812f61dda84fc043)

### MUSDT

MUSDT Contract address: [0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF](https://goerli.etherscan.io/address/0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF)

### MUSDC

MUSDC Contract address: [0xB200af2b733B831Fbb3d98b13076BC33F605aD58](https://goerli.etherscan.io/address/0xB200af2b733B831Fbb3d98b13076BC33F605aD58)

### TimeLock

Time lock Contract address: [0x78B29c165d2faFc78b76A029F0014cAd89900DCa](https://goerli.etherscan.io/address/0x78B29c165d2faFc78b76A029F0014cAd89900DCa)

### BridgeV1

BridgeV1 Contract address: [0x57762d794587EdF59f2087DCD6D99eB0105b1A8f](https://goerli.etherscan.io/address/0x57762d794587EdF59f2087DCD6D99eB0105b1A8f)

### BridgeProxy

BridgeProxy Contract address: [0x96E5E1d6377ffA08B9c08B066f430e33e3c4C9ef](https://goerli.etherscan.io/address/0x96E5E1d6377ffA08B9c08B066f430e33e3c4C9ef)

## Fund Bridge ERC20 tokens

### Add funds

Anyone can send funds to the bridge contract. Ideally, this should be done by liquidity providers. If there are tokens sent by other addresses to the contract, those tokens will be unaccounted for.

Admins can send ERC20 tokens via the `transfer(address _to, uint256 _amount)` function or utilizing wallets such as Metamask.

### Withdrawing funds

ETH and ERC20 tokens can be withdrawn by the address with WITHDRAW_ROLE only via the `withdraw(address _tokenAddress, uint256 amount)` function.

## Admin address - Gnosis safe

Admin address will be Gnosis safe, ideally will be with at least 3 owners with a 2/3 quorum.

More admins can be added later, for more info, refer to [Gnosis safe: adding owners](https://help.gnosis-safe.io/en/articles/3950657-add-owners).

Admin Gnosis address: [gor:0xdD42792d3F18bb693A669e5096f866cb96AEdA13](https://goerli.etherscan.io/address/0xdD42792d3F18bb693A669e5096f866cb96AEdA13)

## Workflow for generating Prisma Client and applying database migrations

After making changes to the database schema in schema.prisma, run `cd apps/server` in terminal (/bridge).

Run `./with-db generate` to generate the Prisma Client.

Run `./with-db migrate dev` to migrate and apply database migrations in the development environment.
