# smartcontracts

A package which contains the Ethereum smart contracts for the DeFiChain to Ethereum bridge.

## Operations for smart contract

We are implementing a TimeLock contract that will work for DEFAULT_ADMIN_ROLE tx of BridgeProxy Contract. There will be 3 days delay on every operational tx except when calling `Withdraw()` function, TimeLock contract is not able to call this function.

### TimeLock Contract Operations

Gnosis safe will be implemented with both proposers and executors roles. Only the Timelock smart contract has the role (TIMELOCK_ADMIN_ROLE) to grant roles with regards to timelock contract for now. If we want to grant new roles to new addresses, have to go through a round of scheduling and executing the grantRole functions through the Timelock contract. When revoking privileges, either the revokeRole() or renounceRole() functions must be used.

#### Scheduling and executing DEFAULT_ADMIN_ONLY transactions for BridgeProxy Contract

To execute DEFAULT_ONLY_ADMIN transactions for Bridge Contract, the developer will need to follow these steps:

- First, create a transaction using Safe [guide](<(https://help.safe.global/en/articles/3738081-contract-interactions),>).
- After providing the contract address and ABI, the developer can select the contract method (in this case, we will try to change the transaction fee).
- Select "Schedule". According to the Schedule() function, the following arguments need to be provided: address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt, and uint256 delay.
- The target address is the Proxy Bridge. The value will usually be 0. The data is the encoded data of the function and arguments (BridgeV1Interface.encodeFunctionData('changeTxFee', [100])). Predecessor should almost always be 0x0 unless we have a prerequisite transaction, salt will be in incremented order (e.g. 0x0...0, 0x0...1, 0x0...2, 0x0...3, and so on) and delay (in seconds) should be >= `getMinDelay()` which will be set to 3 days.

Salt can be `0x0000000000000000000000000000000000000000000000000000000000000000` for 1st transaction,
`0x0000000000000000000000000000000000000000000000000000000000000001` for 2nd transaction and so on.

The reason behind choosing different salt is to avoid having the same operation identifier again.

After scheduling the transaction using a timelock, the developer must call the execute() function with the provided arguments(same as above). If the execute() function is called before the specified `delay` time has passed, the transaction will revert with the error message "TimelockController: operation is not ready". This is because the timelock is designed to ensure that the specified delay time has elapsed before the transaction can be executed. Once the delay time has passed, the transaction can be executed normally.

### BridgeProxy Contract operations

#### BridgeProxy Contract Account Permission

There are only two roles: DEFAULT_ADMIN_ROLE and WITHDRAW_ROLE.

The TimeLock contract is assigned the DEFAULT_ADMIN_ROLE, while another Gnosis Safe is assigned the WITHDRAW_ROLE. The DEFAULT_ADMIN_ROLE has the ability to grant both roles to other addresses, but these changes will happen instantly once executed.

Finally, both addresses can renounce their own roles by calling the renounceRole() function.

#### Bridge ERC20 tokens - to transfer ERC20 tokens from an EOA to the Bridge

Once approving the bridge contract, user will call the `bridgeToDeFiChain(bytes,address,uint256)` function with following arguments: `_defiAddress`- address on Defi Chain that receiving funds, `_tokenAddress` - ERC20 token's address and `_amount` amount to bridge over to Defi chain.

#### Add supported token

Only address with the DEFAULT_ADMIN_ROLE can call the `addSupportedTokens(address,uint256)` function. This sets the `_tokenCap` for an ERC20 token and ETH identified by its `_tokenAddress`. All added tokens will be instantly supported by the bridge.

In case of ETH, address(0) will be used as an address.

`_tokenCap` represents the maximum balance of tokens the contract can hold per `_tokenAddress`

#### Remove supported token

Only address with the DEFAULT_ADMIN_ROLE can call the `removeSupportedTokens(address)` function. This also sets the `_tokenCap` to `0`.

#### Withdraw

`withdraw(address,uint256)` function when called will withdraw an ERC20 token and ETH (address == 0x0). Only the address with the WITHDRAW_ROLE can call this function.

#### flushMultipleTokenFunds

`flushMultipleTokenFunds(uint256 _fromIndex, uint256 _toIndex)` function to flush the excess funds `(token.balanceOf(BridgeProxy) - tokenCap)` across supported tokens to a hardcoded address (`flushReceiveAddress`) anyone can call this function. For example, calling flushMultipleTokenFunds(0,3), only the tokens at index 0, 1 and 2 will be flushed. This applies to all tokens and ETH.

#### flushFundPerToken

`flushFundPerToken(address _tokenAddress)` is doing same as above function, however doing on token basis instead of from and to indexes.

#### Change Flush Receive Address

DEFAULT_ADMIN_ROLE address can change `flushReceiveAddress`.
`changeFlushReceiveAddress(address)` function will reset the `flushReceiveAddress` to new address.

#### Change relayer address

Address with DEFAULT_ADMIN_ROLE can change `relayerAddress` via function `changeRelayerAddress(address)`.

The relayer address will primarily be used for verifying the signature that is signed by the server. The server will need to sign with the corresponding private key of the relayer address.

#### Transaction fee change

Only address with DEFAULT_ADMIN_ROLE can change `transactionFee` via function `changeTxFee(uint256)`.

Initial fee will be set to 0%. This means that if the user bridges `X` tokens, 100% of X will be bridged to defiChain. If in the future, fee > 0, respected amount will be sent to `communityWallet`.

#### Change Tx Fee Address

Only address with DEFAULT_ADMIN_ROLE can change `communityWallet` via function `changeTxFeeAddress(address)`. This is where the tx fees upon bridging will go.

#### Change Token Cap

Only address with DEFAULT_ADMIN_ROLE can change `tokenCap` via function `changeTokenCap(address,uint256)`.

#### Modify roles (i.e. DEFAULT_ADMIN_ROLE and WITHDRAW_ROLE)

`grantRole(bytes32 role,address)` and `revokeRole(bytes32 role,address)` will be used to grant a role to new addresses and revoke the existing addresses role respectively. Requirement: the caller must be have "role" 's admin role to grant or revoke for that "role"

`renounceRole(bytes32 role,address account)` provides a mechanism for accounts to lose their own privileges. The caller must be `account`.

#### Upgrade smart contracts

There are two functions to upgrade the implementation smart contract: `upgradeTo(address)` and `upgradeToAndCall(address,bytes)` functions. These can only be used by DEFAULT_ADMIN_ROLE
