import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
error ETH_TRANSFER_FAILED();
error AMOUNT_PARAMETER_NOT_ZERO_WHEN_BRIDGING_ETH();
error MSG_VALUE_NOT_ZERO_WHEN_BRIDGING_ERC20();
error REQUESTED_BRIDGE_AMOUNT_IS_ZERO();
error TOKEN_ALREADY_SUPPORTED();
error TOKEN_NOT_SUPPORTED();
error MORE_THAN_MAX_FEE();
error INVALID_COLD_WALLET();
error INVALID_COMMUNITY_WALLET();

contract BridgeOrderBook is
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    AccessControlUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address public constant ETH = address(0);
    uint256 public constant MAX_FEE = 10000;

    address public coldWallet;
    address public communityWallet;
    uint256 public transactionFee;
    mapping(address => bool) public supportedTokens;

    event BRIDGE_TO_DEFI_CHAIN(
        bytes defiAddress,
        address tokenAddress,
        uint256 bridgeAmount
    );

    event TOKEN_SUPPORTED(address tokenAddress);
    event TOKEN_REMOVED(address tokenAddress);
    event TRANSACTION_FEE_CHANGED(uint256 oldTxFee, uint256 transactionFee);
    event COLD_WALLET_CHANGED(address oldColdWallet, address newColdWallet);
    event COMMUNITY_WALLET_CHANGED(
        address oldCommunityWallet,
        address newCommunityWallet
    );

    constructor() {
        _disableInitializers();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function intialize(
        address _timelockContract,
        address _coldWallet,
        uint256 _fee,
        address _communityWallet
    ) external initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, _timelockContract);
        coldWallet = _coldWallet;
        transactionFee = _fee;
        communityWallet = _communityWallet;
    }

    function bridgeToDeFiChain(
        bytes calldata _defiAddress,
        address _tokenAddress,
        uint256 _amount
    ) external payable {
        if (!supportedTokens[_tokenAddress]) revert TOKEN_NOT_SUPPORTED();
        uint256 requestedAmount;
        if (_tokenAddress == ETH) {
            if (_amount > 0)
                revert AMOUNT_PARAMETER_NOT_ZERO_WHEN_BRIDGING_ETH();
            requestedAmount = msg.value;
        } else {
            if (msg.value > 0) revert MSG_VALUE_NOT_ZERO_WHEN_BRIDGING_ERC20();
            requestedAmount = _amount;
        }
        if (requestedAmount == 0) revert REQUESTED_BRIDGE_AMOUNT_IS_ZERO();
        uint256 txFee = calculateFee(requestedAmount);
        uint256 netAmount = requestedAmount - txFee;
        emit BRIDGE_TO_DEFI_CHAIN(_defiAddress, _tokenAddress, netAmount);
        if (_tokenAddress == ETH) {
            (bool sentTxFee, ) = communityWallet.call{value: txFee}("");
            if (!sentTxFee) revert ETH_TRANSFER_FAILED();
            (bool sentNetAmount, ) = coldWallet.call{value: netAmount}("");
            if (!sentNetAmount) revert ETH_TRANSFER_FAILED();
        } else {
            IERC20Upgradeable(_tokenAddress).safeTransferFrom(
                msg.sender,
                communityWallet,
                txFee
            );
            IERC20Upgradeable(_tokenAddress).safeTransferFrom(
                msg.sender,
                coldWallet,
                netAmount
            );
        }
    }

    function calculateFee(uint256 _amount) internal view returns (uint256) {
        return (_amount * transactionFee) / 10000;
    }

    function addSupportedToken(
        address _tokenAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (supportedTokens[_tokenAddress]) revert TOKEN_ALREADY_SUPPORTED();
        supportedTokens[_tokenAddress] = true;
        emit TOKEN_SUPPORTED(_tokenAddress);
    }

    function removeSupportedToken(
        address _tokenAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!supportedTokens[_tokenAddress]) revert TOKEN_NOT_SUPPORTED();
        supportedTokens[_tokenAddress] = false;
        emit TOKEN_REMOVED(_tokenAddress);
    }

    function changeTxFee(uint256 fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (fee > MAX_FEE) revert MORE_THAN_MAX_FEE();
        uint256 oldTxFee = transactionFee;
        transactionFee = fee;
        emit TRANSACTION_FEE_CHANGED(oldTxFee, transactionFee);
    }

    function changeColdWallet(
        address _newColdWallet
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_newColdWallet == address(0)) revert INVALID_COLD_WALLET();
        address oldColdWallet = coldWallet;
        coldWallet = _newColdWallet;
        emit COLD_WALLET_CHANGED(oldColdWallet, _newColdWallet);
    }

    function changeCommunityWallet(
        address _newCommunityWallet
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_newCommunityWallet == address(0))
            revert INVALID_COMMUNITY_WALLET();
        address oldCommunityWallet = communityWallet;
        communityWallet = _newCommunityWallet;
        emit COMMUNITY_WALLET_CHANGED(oldCommunityWallet, _newCommunityWallet);
    }
}
