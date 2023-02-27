// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IBridgeV1 {
    function bridgeToDeFiChain(
        bytes calldata _defiAddress,
        address _tokenAddress,
        uint256 _amount
    ) external payable;
}
