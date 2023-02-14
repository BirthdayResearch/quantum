// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';
import '@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import 'hardhat/console.sol';

/** @notice @dev  
/* This error occurs when token is in change allowance period.
*/
error STILL_IN_CHANGE_ALLOWANCE_PERIOD();

/** @notice @dev  
/* This error occurs when incoorect nonce provided
*/
error INCORRECT_NONCE();

/** @notice @dev  
/* This error occurs when token is not in supported list
*/
error TOKEN_NOT_SUPPORTED();

/** @notice @dev  
/* This error occurs when fake signatures being used to claim fund
*/
error FAKE_SIGNATURE();

/** @notice @dev  
/* This error occurs when bridging amount exceeds dailyAllowance limit
*/
error EXCEEDS_DAILY_ALLOWANCE();

/** @notice @dev  
/* This error occurs when token is already in supported list
*/
error TOKEN_ALREADY_SUPPORTED();

/** @notice @dev  
/* This error occurs when using Zero address
*/
error ZERO_ADDRESS();

/** @notice @dev  
/* This error occurs when the msg.sender doesn't have neither DEFAULT_ADMIN_ROLE or OPERATIONAL_ROLE assigned
*/
error NON_AUTHORIZED_ADDRESS();

/** @notice @dev 
/* This error occurs when Admin(s) try to change daily allowance of un-supported token.
*/
error ONLY_SUPPORTED_TOKENS();

/** @notice @dev 
/* This error occurs when `_newResetTimeStamp` is before block.timestamp
*/
error INVALID_RESET_EPOCH_TIME();

/** @notice @dev 
/* This error occurs when `_newResetTimeStamp` is before block.timestamp
*/
error EXPIRED_CLAIM();

/** @notice @dev 
/* This error occurs when `_amount` is zero
*/
error AMOUNT_CAN_NOT_BE_ZERO();

contract BridgeV1 is UUPSUpgradeable, EIP712Upgradeable, AccessControlUpgradeable {
    using EnumerableSet for EnumerableSet.AddressSet;
    struct TokenAllowance {
        uint256 latestResetTimestamp;
        uint256 dailyAllowance;
        uint256 currentDailyUsage;
    }

    // Mapping to track the address's nonce
    mapping(address => uint256) public eoaAddressToNonce;

    // Enumerable set of supportedTokens
    EnumerableSet.AddressSet internal supportedTokens;

    address public relayerAddress;

    bytes32 constant DATA_TYPE_HASH =
        keccak256('CLAIM(address to,uint256 amount,uint256 nonce,uint256 deadline,address tokenAddress)');

    // Mapping to track token address to TokenAllowance
    mapping(address => TokenAllowance) public tokenAllowances;

    bytes32 public constant OPERATIONAL_ROLE = keccak256('OPERATIONAL_ROLE');

    string public constant name = 'QUANTUM_BRIDGE';
    string public constant version = '1.0';

    // Initial Tx fee 0.3%. Based on dps (e.g 1% == 100dps)
    uint256 public transactionFee;
    // Community wallet to send tx fees to
    address public communityWallet;

    // Address to receive the flush
    address public flushReceiveAddress;

    // The remaining day variable used when flushing
    uint256 public acceptableRemainingDays;

    /**
     * @notice Emitted when the user claims funds from the bridge
     * @param tokenAddress Token that is being claimed
     * @param to Address that funds  will be transferred to
     * @param amount Amount of the token being claimed
     */
    event CLAIM_FUND(address indexed tokenAddress, address indexed to, uint256 indexed amount);

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

    /**
     * @notice Emitted when a new token is being added to the supported list by only Admin accounts
     * @param supportedToken Address of the token being added to the supported list
     * @param dailyAllowance Daily allowance of the token
     */
    event ADD_SUPPORTED_TOKEN(address indexed supportedToken, uint256 indexed dailyAllowance);

    /**
     * @notice Emitted when the existing supported token is removed from the supported list by only Admin accounts
     * @param token Address of the token removed from the supported list
     */
    event REMOVE_SUPPORTED_TOKEN(address indexed token);

    /**
     * @notice Emitted when the dailyAllowance of an existing supported token is changed by only Admin accounts
     * @param supportedToken Address of the token being added to supported token
     * @param changeDailyAllowance The new daily allowance of the supported token
     * @param previousTimeStamp The old reset timeStamp of the supported token that is being replaced
     * @param newTimeStamp The new reset timeStamp of when the supported token starts to be supported
     */
    event CHANGE_DAILY_ALLOWANCE(
        address indexed supportedToken,
        uint256 indexed changeDailyAllowance,
        uint256 indexed previousTimeStamp,
        uint256 newTimeStamp
    );

    /**
     * @notice Emitted when withdrawal of supportedToken only by the Admin account
     * @param ownerAddress Owner's address initiating withdrawal
     * @param withdrawalTokenAddress Address of the token that being withdrawed
     * @param withdrawalAmount Withdrawal amount of token
     */
    event WITHDRAWAL_BY_OWNER(
        address indexed ownerAddress,
        address indexed withdrawalTokenAddress,
        uint256 indexed withdrawalAmount
    );

    /**
     * @notice Emitted when relayer address changes by only Admin accounts
     * @param oldAddress Old relayer's address
     * @param newAddress New relayer's address
     */
    event RELAYER_ADDRESS_CHANGED(address indexed oldAddress, address indexed newAddress);

    /**
     * @notice Emitted when transcation fee is changed by only Admin accounts
     * @param oldTxFee Old transcation fee in bps
     * @param newTxFee New transcation fee in bps
     */
    event TRANSACTION_FEE_CHANGED(uint256 indexed oldTxFee, uint256 indexed newTxFee);

    /**
     * @notice Emitted when the address to send transcation fees to is changed by Admin accounts
     * @param oldAddress Old community's Address
     * @param newAddress Old community's Address
     */
    event TRANSACTION_FEE_ADDRESS_CHANGED(address indexed oldAddress, address indexed newAddress);

    /**
     * @notice Emitted when fund is flushed
     */
    event FLUSH_FUND();

    /**
     * @notice Emitted when the address to be flushed to is changed
     * @param oldAddress The old address to be flushed to
     * @param newAddress The new address to be flushed to
     */
    event CHANGE_FLUSH_RECEIVE_ADDRESS(address oldAddress, address newAddress);

    /**
     * @notice Emitted when the remaining days variable for flushing is changed
     * @param oldDayRemaining The old remaining days
     * @param newDayRemaining The new remaining days
     */
    event CHANGE_ACCEPTABLE_REMAINING_DAYS(uint256 oldDayRemaining, uint256 newDayRemaining);

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @notice To initialize this contract (No constructor as part of the proxy pattery )
     * @param _initialAdmin Initial admin address of this contract
     * @param _initialOperational Initial operational address of this contract
     * @param _relayerAddress Relayer address for signature
     * @param _communityWallet Community address for tx fees
     * @param _fee Fee charged on each transcation (initial fee: 0.3%)
     */
    function initialize(
        address _initialAdmin,
        address _initialOperational,
        address _relayerAddress,
        address _communityWallet,
        uint256 _fee,
        address _flushReceiveAddress,
        uint256 _acceptableRemainingDays
    ) external initializer {
        __UUPSUpgradeable_init();
        __EIP712_init(name, version);
        _grantRole(DEFAULT_ADMIN_ROLE, _initialAdmin);
        _grantRole(OPERATIONAL_ROLE, _initialOperational);
        communityWallet = _communityWallet;
        relayerAddress = _relayerAddress;
        transactionFee = _fee;
        flushReceiveAddress = _flushReceiveAddress;
        acceptableRemainingDays = _acceptableRemainingDays;
    }

    /**
     * @notice Used to claim the tokens that have been approved by the relayer (for bridging from DeFiChain to Ethereum mainnet)
     * @param _to Address to send the claimed fund
     * @param _amount Amount to be claimed
     * @param _nonce Nonce of the address making the claim
     * @param _deadline Deadline of txn. Claims must be made before the deadline.
     * @param _tokenAddress Token address of the supported token
     * @param signature Signature provided by the server
     */
    function claimFund(
        address _to,
        uint256 _amount,
        uint256 _nonce,
        uint256 _deadline,
        address _tokenAddress,
        bytes calldata signature
    ) external {
        if (eoaAddressToNonce[_to] != _nonce) revert INCORRECT_NONCE();
        if (!supportedTokens.contains(_tokenAddress)) revert TOKEN_NOT_SUPPORTED();
        if (block.timestamp > _deadline) revert EXPIRED_CLAIM();
        bytes32 struct_hash = keccak256(abi.encode(DATA_TYPE_HASH, _to, _amount, _nonce, _deadline, _tokenAddress));
        bytes32 msg_hash = _hashTypedDataV4(struct_hash);
        if (ECDSAUpgradeable.recover(msg_hash, signature) != relayerAddress) revert FAKE_SIGNATURE();
        eoaAddressToNonce[_to]++;
        IERC20(_tokenAddress).transfer(_to, _amount);
        emit CLAIM_FUND(_tokenAddress, _to, _amount);
    }

    /**
     * @notice Used to transfer the supported token from Mainnet(EVM) to DefiChain
     * Transfer will only be possible if not in change allowance peroid.
     * @param _defiAddress DefiChain token address
     * @param _tokenAddress Supported token address that being bridged
     * @param _amount Amount to be bridged, this in in Wei
     */
    function bridgeToDeFiChain(
        bytes calldata _defiAddress,
        address _tokenAddress,
        uint256 _amount
    ) external {
        if (!supportedTokens.contains(_tokenAddress)) revert TOKEN_NOT_SUPPORTED();
        uint256 tokenAllowanceStartTime = tokenAllowances[_tokenAddress].latestResetTimestamp;
        if (block.timestamp < tokenAllowanceStartTime) revert STILL_IN_CHANGE_ALLOWANCE_PERIOD();
        if (_amount == 0) revert AMOUNT_CAN_NOT_BE_ZERO();
        // Transaction is within the last tracked day's daily allowance
        if (tokenAllowances[_tokenAddress].latestResetTimestamp + (1 days) > block.timestamp) {
            tokenAllowances[_tokenAddress].currentDailyUsage += _amount;
            if (tokenAllowances[_tokenAddress].currentDailyUsage > tokenAllowances[_tokenAddress].dailyAllowance)
                revert EXCEEDS_DAILY_ALLOWANCE();
        } else {
            tokenAllowances[_tokenAddress].latestResetTimestamp +=
                ((block.timestamp - tokenAllowances[_tokenAddress].latestResetTimestamp) / (1 days)) *
                1 days;
            tokenAllowances[_tokenAddress].currentDailyUsage = _amount;
            if (tokenAllowances[_tokenAddress].currentDailyUsage > tokenAllowances[_tokenAddress].dailyAllowance)
                revert EXCEEDS_DAILY_ALLOWANCE();
        }
        uint256 netAmountInWei = amountAfterFees(_amount);
        uint256 netTxFee = _amount - netAmountInWei;
        IERC20(_tokenAddress).transferFrom(msg.sender, address(this), netAmountInWei);
        IERC20(_tokenAddress).transferFrom(msg.sender, communityWallet, netTxFee);
        emit BRIDGE_TO_DEFI_CHAIN(_defiAddress, _tokenAddress, netAmountInWei, block.timestamp);
    }

    /**
     * @notice Used by addresses with Admin and Operational roles to add a new supported token and daily allowance
     * @param _tokenAddress The token address to be added to supported list
     * @param _dailyAllowance Daily allowance set for the token
     * @param _startAllowanceTimeFrom TimeStamp of when token will be supported.
     */
    function addSupportedTokens(
        address _tokenAddress,
        uint256 _dailyAllowance,
        uint256 _startAllowanceTimeFrom
    ) external {
        if (!checkRoles()) revert NON_AUTHORIZED_ADDRESS();
        if (block.timestamp > _startAllowanceTimeFrom) revert INVALID_RESET_EPOCH_TIME();
        if (_tokenAddress == address(0)) revert ZERO_ADDRESS();
        if (supportedTokens.contains(_tokenAddress)) revert TOKEN_ALREADY_SUPPORTED();
        // Token will be added on the supported list regardless of `_startAllowanceTimeFrom`
        supportedTokens.add(_tokenAddress);
        tokenAllowances[_tokenAddress].latestResetTimestamp = _startAllowanceTimeFrom;
        tokenAllowances[_tokenAddress].dailyAllowance = _dailyAllowance;
        tokenAllowances[_tokenAddress].currentDailyUsage = 0;
        emit ADD_SUPPORTED_TOKEN(_tokenAddress, _dailyAllowance);
    }

    /**
     * @notice Used by addresses with Admin and Operational roles to remove an exisiting supported token
     * @param _tokenAddress The token address to be removed from supported list
     */
    function removeSupportedTokens(address _tokenAddress) external {
        if (!checkRoles()) revert NON_AUTHORIZED_ADDRESS();
        if (!supportedTokens.contains(_tokenAddress)) revert TOKEN_NOT_SUPPORTED();
        supportedTokens.remove(_tokenAddress);
        tokenAllowances[_tokenAddress].latestResetTimestamp = 0;
        tokenAllowances[_tokenAddress].dailyAllowance = 0;
        tokenAllowances[_tokenAddress].currentDailyUsage = 0;
        emit REMOVE_SUPPORTED_TOKEN(_tokenAddress);
    }

    /**
     * @notice Used by addresses with Admin and Operational roles to set the new daily allowance
     * for corresponding token
     * @param _tokenAddress The token address to set the allowance
     * @param _dailyAllowance Daily allowance set for the token
     * @param _newResetTimeStamp new time stamp in seconds
     */
    function changeDailyAllowance(
        address _tokenAddress,
        uint256 _dailyAllowance,
        uint256 _newResetTimeStamp
    ) external {
        if (!checkRoles()) revert NON_AUTHORIZED_ADDRESS();
        if (!supportedTokens.contains(_tokenAddress)) revert ONLY_SUPPORTED_TOKENS();
        if (_newResetTimeStamp < block.timestamp + 1 days) revert INVALID_RESET_EPOCH_TIME();
        tokenAllowances[_tokenAddress].dailyAllowance = _dailyAllowance;
        uint256 prevTimeStamp = tokenAllowances[_tokenAddress].latestResetTimestamp;
        tokenAllowances[_tokenAddress].latestResetTimestamp = _newResetTimeStamp;
        tokenAllowances[_tokenAddress].currentDailyUsage = 0;
        emit CHANGE_DAILY_ALLOWANCE(_tokenAddress, _dailyAllowance, prevTimeStamp, _newResetTimeStamp);
    }

    /**
     * @notice Used by Admin only. When called, the specified amount will be withdrawn
     * @param _tokenAddress The token that will be withdraw
     * @param amount Requested amount to be withdraw. Amount would be in the denomination of ETH
     */
    function withdraw(address _tokenAddress, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(_tokenAddress).transfer(msg.sender, amount);
        emit WITHDRAWAL_BY_OWNER(msg.sender, _tokenAddress, amount);
    }

    /**
     * @notice Function to flush the excess funds across supported tokens to a hardcoded address
     * anyone can call this function
     */
    function flushFund() external {
        for (uint256 i = 0; i < supportedTokens.length(); ++i) {
            address supToken = supportedTokens.at(i);
            if (
                (IERC20(supToken).balanceOf(address(this)) >
                    acceptableRemainingDays * tokenAllowances[supToken].dailyAllowance) &&
                // the same logic as in bridgeToDeFiChain applies here, if we are still
                // in the period for addingSupport or changingDailyAllowance, we will not flush for that particular token
                (tokenAllowances[supToken].latestResetTimestamp <= block.timestamp)
            ) {
                uint256 amountToFlush = IERC20(supToken).balanceOf(address(this)) -
                    acceptableRemainingDays *
                    tokenAllowances[supToken].dailyAllowance;
                IERC20(supToken).transfer(flushReceiveAddress, amountToFlush);
            }
        }
        emit FLUSH_FUND();
    }

    /**
     * @notice Used by addresses with Admin and Operational roles to set the new flush receive address
     * @param _newAddress new address to be flushed to
     */
    function changeFlushReceiveAddress(address _newAddress) external {
        if (!checkRoles()) revert NON_AUTHORIZED_ADDRESS();
        address _oldAddress = flushReceiveAddress;
        flushReceiveAddress = _newAddress;
        emit CHANGE_FLUSH_RECEIVE_ADDRESS(_oldAddress, _newAddress);
    }

    /**
     * @notice Used by addresses with Admin and Operational roles to set the new acceptable remaining days
     * @param _newAcceptableRemainingDays new acceptableRemainingDays to be used when flusing
     */
    function changeAcceptableRemainingDays(uint256 _newAcceptableRemainingDays) external {
        if (!checkRoles()) revert NON_AUTHORIZED_ADDRESS();
        uint256 _oldAcceptableRemainingDays = acceptableRemainingDays;
        acceptableRemainingDays = _newAcceptableRemainingDays;
        emit CHANGE_ACCEPTABLE_REMAINING_DAYS(_oldAcceptableRemainingDays, _newAcceptableRemainingDays);
    }

    /**
     * @notice Used by addresses with Admin and Operational roles to set the new _relayerAddress
     * @param _relayerAddress The new relayer address, ie. the address used by the server for signing claims
     */
    function changeRelayerAddress(address _relayerAddress) external {
        if (!checkRoles()) revert NON_AUTHORIZED_ADDRESS();
        if (_relayerAddress == address(0)) revert ZERO_ADDRESS();
        address oldRelayerAddress = relayerAddress;
        relayerAddress = _relayerAddress;
        emit RELAYER_ADDRESS_CHANGED(oldRelayerAddress, _relayerAddress);
    }

    /**
     * @notice Called by addresses with Admin and Operational roles to set the new txn fee
     * @param fee The new fee
     */
    function changeTxFee(uint256 fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldTxFee = transactionFee;
        transactionFee = fee;
        emit TRANSACTION_FEE_CHANGED(oldTxFee, transactionFee);
    }

    /**
     * @notice Called by addresses with Admin and Operational roles to set the new wallet for sending transaction fees to
     * @param _newAddress The new community address
     */
    function changeTxFeeAddress(address _newAddress) external {
        if (!checkRoles()) revert NON_AUTHORIZED_ADDRESS();
        if (_newAddress == address(0)) revert ZERO_ADDRESS();
        address oldAddress = communityWallet;
        communityWallet = _newAddress;
        emit TRANSACTION_FEE_ADDRESS_CHANGED(oldAddress, _newAddress);
    }

    /**
     * @notice to get the supported tokens, as recursive data structure (supportedTokens) cannot be made public
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens.values();
    }

    /**
     * @notice to check whether a token is supported
     */
    function isSupported(address _tokenAddress) public view returns (bool) {
        return supportedTokens.contains(_tokenAddress);
    }

    /**
     * @notice Primarily being used to check the admin roles
     * @return check true if msg.sender id one of admins, false otherwise.
     */
    function checkRoles() internal view returns (bool check) {
        return check = hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(OPERATIONAL_ROLE, msg.sender);
    }

    /**
     * This function provides the net amount after deducting fee
     * @param _amount Ideally will be the value of erc20 token
     * @return netAmountInWei net balance after the fee amount taken
     */
    function amountAfterFees(uint256 _amount) internal view returns (uint256 netAmountInWei) {
        netAmountInWei = _amount - (_amount * transactionFee) / 10000;
    }
}
