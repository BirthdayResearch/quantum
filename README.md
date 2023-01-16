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

TODO

### Sample metamask transaction of claim transaction?

TODO

### General explanation on how the contract works from an EVM perspective?

TODO

## Operational Transactions

To change state of any smart contract, user needs to approve the smart contract with the respected token via `approve()` function first. Once approved, user will be able to bridge the token over to DefiChain.

### Fund ERC20 tokens - to transfer ERC20 tokens from an EOA to the Bridge

Once approved, user will call the `bridgeToDeFiChain()` function with following the arguments: `_defiAddress`- address on Defi Chain that receiving funds, `_tokenAddress` - ERC20 token's address and `_amount` amount to bridge over to Defi chain.

### Fund Ether - to transfer ERC20 tokens from an EOA to the Bridge

When sending ETHER to bridge, the user will not have to approve the contract. By default, every smart contract accepts ETH. Sending ether will be similar to ERC20, except we don't account for `_amount`, instead `msg.value()` is used. The `_defiAddress` is the address on the Defi Chain that is receiving funds. The `_tokenAddress` for ETH does not have an address, as it is a native currency, it should be `address(0)`/`0x0`.

### Add supported token

Only addresses with Admin and operational roles can call the `addSupportedTokens()` function. Admin sets the `_dailyAllowance`.
Users should not allow bridging more than the dailyAllowance/day.

### Remove supported token

Only addresses with Admin and operational roles can call the `removeSupportedTokens()` function.

### Withdraw ether

Only the Admin can call the `withdrawEth()` function with ETH's amount.

### Withdraw ERC20

Only the Admin can call the `withdraw()` function with the token's address and amount.

### Change Daily Allowance

Both the Admin and Operational addresses can change the `_dailyAllowance` and `_newResetTimeStamp` via `changeDailyAllowance()` function. This will reset the `inChangeAllowancePeriod` to true. When true, no bridging to the Defi chain is allowed. The allowance period stays true until it passes 24 hours since it was changed.

### Withdraw / withdrawEth

`withdraw()` and `withdrawEth()` functions when called will withdraw ERC20 token and ETHER respectively. Only address with admin role can call these functions.

### Change relayer address

Both the Admin and Operational addresses can change `relayerAddress`.
Relayer address will primarily be used for signature.

### Transaction fee change

Only address with admin role can change `transactionFee`. Initial fee will be set to 0.3%

### Modify admin and operational address

`grantRole` and `revokeRole` will be used to a grant role to new addresses and revoke the existing addresses role respectively.
