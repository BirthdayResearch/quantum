// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract ShellBridgeV1 {
    using SafeERC20 for IERC20;
    IBridge public iBridge;
    /**
     * @notice Emitted when the user bridges token to DefiChain
     * @param defiAddress defiAddress DeFiChain address of user
     * @param tokenAddress Supported token's being bridged
     * @param amount Amount of the token being bridged
     * @param timestamp TimeStamp of the transaction
     */
    event BRIDGE_TO_DEFI_CHAIN(
        bytes indexed defiAddress,
        address indexed tokenAddress,
        uint256 indexed amount,
        uint256 timestamp
    );

    constructor(address _address) {
        iBridge = IBridge(_address);
    }

    /**
     * @notice Used to transfer the supported token from Mainnet(EVM) to DefiChain
     * Transfer will only be possible if not in change allowance peroid.
     * @param _defiAddress DefiChain token address
     * @param _tokenAddress Supported token address that being bridged
     * @param _amount Amount to be bridged, this in in Wei
     */
    function bridgeToDeFiChain(bytes calldata _defiAddress, address _tokenAddress, uint256 _amount) external payable {
        if (IERC20(_tokenAddress).allowance(address(this), address(iBridge)) == 0) {
            approveBridge(_tokenAddress);
        }
        if (_tokenAddress != address(0)) {
            IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);
        }
        iBridge.bridgeToDeFiChain(_defiAddress, _tokenAddress, _amount);
        emit BRIDGE_TO_DEFI_CHAIN(_defiAddress, _tokenAddress, _amount * 2, block.timestamp);
    }

    function approveBridge(address tokenAddresses) public {
        IERC20(tokenAddresses).safeApprove(address(iBridge), type(uint256).max);
    }
}

interface IBridge {
    function bridgeToDeFiChain(bytes calldata _defiAddress, address _tokenAddress, uint256 _amount) external payable;
}
