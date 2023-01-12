[![CI](https://github.com/WavesHQ/bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/WavesHQ/bridge/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/WavesHQ/bridge/branch/main/graph/badge.svg?token=OXLL8IBZQV)](https://codecov.io/gh/WavesHQ/bridge)

# [DeFiChain Bridge](https://bridge.defichain.com)

> https://bridge.defichain.com

[![Netlify Status](https://api.netlify.com/api/v1/badges/4eaec04e-1416-4c65-843e-d7413fb81d2c/deploy-status)](https://app.netlify.com/sites/defichain-erc20-bridge/deploys)

DeFiChain ERC-20 Bridge

All smart contracts will be deployed on Goerli testnet.

How to get ether on a testnet to make testnet transactions?

Users can get the GoerliETH via Goerli Faucet(https://goerlifaucet.com/)

How to get ERC20 tokens to test bridging functionality?

Ideally, we will have multiple Test tokens available. Users will be able to mint tokens by calling `mint()` function with respected EOA/contract address and amount.

When bridging to DeFiChain, what is the event that devs need to listen to, and what is the payload of that event?

On bridging to DeFiChain, `event BRIDGE_TO_DEFI_CHAIN(bytes defiAddress,address indexed tokenAddress,uint256 indexed amount ,uint256 indexed timestamp);` will be emitted with along with user's defiAddress, ERC20 token's address that is being bridge, amount of the token being bridged and timeStamp of the transaction.

When bridging from DeFiChain, what is the expected signed message?
TODO
Sample metamask transaction of claim transaction?
TODO
General explanation on how the contract works from an EVM perspective?
TODO

Operational Transactions

To change state of any smart contract, user need to approve the smart contract with the respected token via `approve()` first. Once approved, user will be able to bridge the token over to DefiChain.

Fund ERC20 tokens - to transfer ERC20 tokens from an EOA to the Bridge

Once approved, user will call the `bridgeToDeFiChain()` with following arguments: `_defiAddress`- address on Defi Chain that receiving funds, `_tokenAddress` - ERC20 token's address and `_amount` amount to bridge over to Defi chain.

Fund Ether - to transfer ERC20 tokens from an EOA to the Bridge

When sending ETHER to bridge, user will not have to approve this contract. By default, every smart contract accepts ETH.
Sending ether will be similar to ERC20 excepts we don't account for `_amount` instead `msg.value()`.
`_defiAddress`- address on Defi Chain that receiving funds, `_tokenAddress` - `ETH` does not have the address (being a native currency). In case of `ETH`- `_tokenAddress` should be address(0)/0x0.

Add supported token
Remove supported token
Withdraw ether
Withdraw ERC20
Change Daily allowance
Change relayer address
Change reset daily allowance time(UNIX)
Transaction fee change
Add operational address
Modify admin address
