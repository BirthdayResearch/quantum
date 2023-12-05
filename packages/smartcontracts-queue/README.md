# Operations for smart contract

## BridgeQueueProxy Contract operations

### BridgeQueueProxy Contract Account Permission

There is only one role for BridgeQueueProxy: DEFAULT_ADMIN_ROLE, which is assigned to the Timelock contract.

### Add supported token

Only address with DEFAULT_ADMIN_ROLE can call the `addSupportedToken(address)` function.
The argument for this function is `_tokenAddress` which is the address of the ERC20 token to add support (for ETH, it will be 0x0000000000000000000000000000000000000000)

### Remove supported token

Only address with DEFAULT_ADMIN_ROLE can call the `removeSupportedToken(address)` function. The argument for this function is `_tokenAddress` which is the address of the ERC20 token to remove support

### Change transaction fee

Only address with DEFAULT_ADMIN_ROLE can change `transactionFee`. This can be done by using function `changeTxFee(uint256 _fee)`

### Change cold wallet

Only address with DEFAULT_ADMIN_ROLE can change `coldWallet`. This can be done by using function `changeColdWallet(address)`.

### Change community wallet

Only address with DEFAULT_ADMIN_ROLE can change `communityWallet`. This can be done by using function `changeCommunityWallet(address)`. This will be address that the bridge fee will be transferred to.

### Modify roles

`grantRole(bytes32 role,address)` and `revokeRole(bytes32 role,address)` will be used to grant a role to new addresses and revoke the existing addresses role respectively. Requirement: the caller must be have "role" 's admin role to grant or revoke for that "role"

`renounceRole(bytes32 role,address account)` provides a mechanism for accounts to lose their own privileges. The caller must be `account`.

### Upgrade smart contracts

There are two functions to upgrade the implementation smart contract: `upgradeTo(address)` and `upgradeToAndCall(address,bytes)` functions. These can only be used by DEFAULT_ADMIN_ROLE
