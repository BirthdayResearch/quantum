import { ETH_WALLET_PRIVATE_KEY, rpcURL, TestTokenAbi } from "./ethUtils";

const { ethers } = require("ethers");
const axios = require("axios");

const BridgeV1Abi = {
  abi: [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [],
      name: "AMOUNT_PARAMETER_NOT_ZERO_WHEN_BRIDGING_ETH",
      type: "error",
    },
    {
      inputs: [],
      name: "ETH_TRANSFER_FAILED",
      type: "error",
    },
    {
      inputs: [],
      name: "EXPIRED_CLAIM",
      type: "error",
    },
    {
      inputs: [],
      name: "FAKE_SIGNATURE",
      type: "error",
    },
    {
      inputs: [],
      name: "INCORRECT_NONCE",
      type: "error",
    },
    {
      inputs: [],
      name: "INVALID_TOINDEX",
      type: "error",
    },
    {
      inputs: [],
      name: "MORE_THAN_MAX_FEE",
      type: "error",
    },
    {
      inputs: [],
      name: "MSG_VALUE_NOT_ZERO_WHEN_BRIDGING_ERC20",
      type: "error",
    },
    {
      inputs: [],
      name: "REQUESTED_BRIDGE_AMOUNT_IS_ZERO",
      type: "error",
    },
    {
      inputs: [],
      name: "TOKEN_ALREADY_SUPPORTED",
      type: "error",
    },
    {
      inputs: [],
      name: "TOKEN_NOT_SUPPORTED",
      type: "error",
    },
    {
      inputs: [],
      name: "ZERO_ADDRESS",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "supportedToken",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenCap",
          type: "uint256",
        },
      ],
      name: "ADD_SUPPORTED_TOKEN",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "previousAdmin",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "newAdmin",
          type: "address",
        },
      ],
      name: "AdminChanged",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes",
          name: "defiAddress",
          type: "bytes",
        },
        {
          indexed: true,
          internalType: "address",
          name: "tokenAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "timestamp",
          type: "uint256",
        },
      ],
      name: "BRIDGE_TO_DEFI_CHAIN",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "beacon",
          type: "address",
        },
      ],
      name: "BeaconUpgraded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "oldAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newAddress",
          type: "address",
        },
      ],
      name: "CHANGE_FLUSH_RECEIVE_ADDRESS",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "supportedToken",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "oldTokenCap",
          type: "uint256",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "newTokenCap",
          type: "uint256",
        },
      ],
      name: "CHANGE_TOKEN_CAP",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "tokenAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "CLAIM_FUND",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "sender",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "ethAmount",
          type: "uint256",
        },
      ],
      name: "ETH_RECEIVED_VIA_RECEIVE_FUNCTION",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "_tokenAddress",
          type: "address",
        },
      ],
      name: "FLUSH_FUND",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "_fromIndex",
          type: "uint256",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "_toIndex",
          type: "uint256",
        },
      ],
      name: "FLUSH_FUND_MULTIPLE_TOKENS",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint8",
          name: "version",
          type: "uint8",
        },
      ],
      name: "Initialized",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "oldAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newAddress",
          type: "address",
        },
      ],
      name: "RELAYER_ADDRESS_CHANGED",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "token",
          type: "address",
        },
      ],
      name: "REMOVE_SUPPORTED_TOKEN",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "bytes32",
          name: "previousAdminRole",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "bytes32",
          name: "newAdminRole",
          type: "bytes32",
        },
      ],
      name: "RoleAdminChanged",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "address",
          name: "account",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "sender",
          type: "address",
        },
      ],
      name: "RoleGranted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "address",
          name: "account",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "sender",
          type: "address",
        },
      ],
      name: "RoleRevoked",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "oldAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newAddress",
          type: "address",
        },
      ],
      name: "TRANSACTION_FEE_ADDRESS_CHANGED",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "oldTxFee",
          type: "uint256",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "newTxFee",
          type: "uint256",
        },
      ],
      name: "TRANSACTION_FEE_CHANGED",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "implementation",
          type: "address",
        },
      ],
      name: "Upgraded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "withdrawAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "withdrawalTokenAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "withdrawalAmount",
          type: "uint256",
        },
      ],
      name: "WITHDRAWAL",
      type: "event",
    },
    {
      inputs: [],
      name: "DEFAULT_ADMIN_ROLE",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "ETH",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "MAX_FEE",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "NAME",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "WITHDRAW_ROLE",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_tokenAddress",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "_tokenCap",
          type: "uint256",
        },
      ],
      name: "addSupportedTokens",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes",
          name: "_defiAddress",
          type: "bytes",
        },
        {
          internalType: "address",
          name: "_tokenAddress",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "_amount",
          type: "uint256",
        },
      ],
      name: "bridgeToDeFiChain",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_newAddress",
          type: "address",
        },
      ],
      name: "changeFlushReceiveAddress",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_relayerAddress",
          type: "address",
        },
      ],
      name: "changeRelayerAddress",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_tokenAddress",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "_newTokenCap",
          type: "uint256",
        },
      ],
      name: "changeTokenCap",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "fee",
          type: "uint256",
        },
      ],
      name: "changeTxFee",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_newAddress",
          type: "address",
        },
      ],
      name: "changeTxFeeAddress",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "_amount",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_nonce",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_deadline",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "_tokenAddress",
          type: "address",
        },
        {
          internalType: "bytes",
          name: "signature",
          type: "bytes",
        },
      ],
      name: "claimFund",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "communityWallet",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "eoaAddressToNonce",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_tokenAddress",
          type: "address",
        },
      ],
      name: "flushFundPerToken",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_fromIndex",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "_toIndex",
          type: "uint256",
        },
      ],
      name: "flushMultipleTokenFunds",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "flushReceiveAddress",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
      ],
      name: "getRoleAdmin",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getSupportedTokens",
      outputs: [
        {
          internalType: "address[]",
          name: "",
          type: "address[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "grantRole",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "hasRole",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_timelockContract",
          type: "address",
        },
        {
          internalType: "address",
          name: "_initialWithdraw",
          type: "address",
        },
        {
          internalType: "address",
          name: "_relayerAddress",
          type: "address",
        },
        {
          internalType: "address",
          name: "_communityWallet",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "_fee",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "_flushReceiveAddress",
          type: "address",
        },
      ],
      name: "initialize",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_tokenAddress",
          type: "address",
        },
      ],
      name: "isSupported",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "proxiableUUID",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "relayerAddress",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_tokenAddress",
          type: "address",
        },
      ],
      name: "removeSupportedTokens",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "renounceRole",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "role",
          type: "bytes32",
        },
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "revokeRole",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "bytes4",
          name: "interfaceId",
          type: "bytes4",
        },
      ],
      name: "supportsInterface",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "tokenCap",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "transactionFee",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "newImplementation",
          type: "address",
        },
      ],
      name: "upgradeTo",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "newImplementation",
          type: "address",
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes",
        },
      ],
      name: "upgradeToAndCall",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "version",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_tokenAddress",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "_amount",
          type: "uint256",
        },
      ],
      name: "withdraw",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      stateMutability: "payable",
      type: "receive",
    },
  ],
  bytecode:
    "0x60a0604052306080523480156200001557600080fd5b506200002062000026565b620000e8565b600054610100900460ff1615620000935760405162461bcd60e51b815260206004820152602760248201527f496e697469616c697a61626c653a20636f6e747261637420697320696e697469604482015266616c697a696e6760c81b606482015260840160405180910390fd5b60005460ff9081161015620000e6576000805460ff191660ff9081179091556040519081527f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb38474024989060200160405180910390a15b565b6080516132ed6200012060003960008181610b1601528181610b5601528181610c8901528181610cc90152610d5801526132ed6000f3fe6080604052600436106102135760003560e01c80638322fff211610118578063c14d4b8b116100a0578063e02023a11161006f578063e02023a114610668578063e716b9071461069c578063ead6e52a146106bc578063f3fef3a3146106dc578063ff72240f146106fc57600080fd5b8063c14d4b8b146105e5578063c757483914610605578063d3c7c2c714610626578063d547741f1461064857600080fd5b8063a217fddf116100e7578063a217fddf1461054d578063a3f4df7e14610562578063a65830821461059c578063ad33eb89146105bc578063bc063e1a146105cf57600080fd5b80638322fff2146104e057806391d14854146104f557806397044a7b146105155780639ed3edf01461053657600080fd5b806348ec88161161019b57806353c425c11161016a57806353c425c11461043057806354fd4d5014610450578063610103d91461047257806374645bc3146104925780637bcd4ff0146104b257600080fd5b806348ec8816146103c85780634f129c53146103e85780634f1ef2861461040857806352d1902d1461041b57600080fd5b806318a7cca8116101e257806318a7cca8146102ff578063248a9ca3146103385780632f2ff15d1461036857806336568abe146103885780633659cfe6146103a857600080fd5b806301ffc9a71461024c57806307f4d77f146102815780630d88f66b146102a35780631531841b146102df57600080fd5b3661024757604051349033907fce5f5ec085708eb09c22024b8f01de68beefaac52fa083fc27cdaaca124e77e490600090a3005b600080fd5b34801561025857600080fd5b5061026c610267366004612baf565b61071c565b60405190151581526020015b60405180910390f35b34801561028d57600080fd5b506102a161029c366004612bd9565b610753565b005b3480156102af57600080fd5b506102d16102be366004612c17565b61012f6020526000908152604090205481565b604051908152602001610278565b3480156102eb57600080fd5b506102a16102fa366004612c32565b6109d9565b34801561030b57600080fd5b5061013254610320906001600160a01b031681565b6040516001600160a01b039091168152602001610278565b34801561034457600080fd5b506102d1610353366004612c5c565b600090815260fd602052604090206001015490565b34801561037457600080fd5b506102a1610383366004612c75565b610a5f565b34801561039457600080fd5b506102a16103a3366004612c75565b610a89565b3480156103b457600080fd5b506102a16103c3366004612c17565b610b0c565b3480156103d457600080fd5b506102a16103e3366004612c17565b610beb565b3480156103f457600080fd5b5061026c610403366004612c17565b610c71565b6102a1610416366004612cb7565b610c7f565b34801561042757600080fd5b506102d1610d4b565b34801561043c57600080fd5b506102a161044b366004612d79565b610dfe565b34801561045c57600080fd5b50610465610fd1565b6040516102789190612e0a565b34801561047e57600080fd5b506102a161048d366004612c5c565b610fef565b34801561049e57600080fd5b506102a16104ad366004612c32565b611058565b3480156104be57600080fd5b506102d16104cd366004612c17565b6101336020526000908152604090205481565b3480156104ec57600080fd5b50610320600081565b34801561050157600080fd5b5061026c610510366004612c75565b6110e3565b34801561052157600080fd5b5061013654610320906001600160a01b031681565b34801561054257600080fd5b506102d16101345481565b34801561055957600080fd5b506102d1600081565b34801561056e57600080fd5b506104656040518060400160405280600e81526020016d5155414e54554d5f42524944474560901b81525081565b3480156105a857600080fd5b506102a16105b7366004612c17565b61110e565b6102a16105ca366004612e7f565b611195565b3480156105db57600080fd5b506102d161271081565b3480156105f157600080fd5b506102a1610600366004612c17565b61136f565b34801561061157600080fd5b5061013554610320906001600160a01b031681565b34801561063257600080fd5b5061063b6115cb565b6040516102789190612edb565b34801561065457600080fd5b506102a1610663366004612c75565b6115d8565b34801561067457600080fd5b506102d17f5d8e12c39142ff96d79d04d15d1ba1269e4fe57bb9d26f43523628b34ba108ec81565b3480156106a857600080fd5b506102a16106b7366004612c17565b6115fd565b3480156106c857600080fd5b506102a16106d7366004612c17565b611683565b3480156106e857600080fd5b506102a16106f7366004612c32565b611709565b34801561070857600080fd5b506102a1610717366004612f28565b611815565b60006001600160e01b03198216637965db0b60e01b148061074d57506301ffc9a760e01b6001600160e01b03198316145b92915050565b61075e610130611aa6565b81111561077e5760405163d2dc187b60e01b815260040160405180910390fd5b610136546001600160a01b0316825b828110156109a65760006107a361013083611ab0565b90506001600160a01b038116610877576000805261013360205260008051602061329883398151915254471115610872576000808052610133602052600080516020613298833981519152546107f99047612fc0565b90506000846001600160a01b03168260405160006040518083038185875af1925050503d8060008114610848576040519150601f19603f3d011682016040523d82523d6000602084013e61084d565b606091505b505090508061086f57604051634c67134d60e11b815260040160405180910390fd5b50505b610995565b6001600160a01b03811660008181526101336020526040908190205490516370a0823160e01b81523060048201529091906370a0823190602401602060405180830381865afa1580156108ce573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108f29190612fd3565b1115610995576001600160a01b038116600081815261013360205260408082205490516370a0823160e01b8152306004820152919290916370a0823190602401602060405180830381865afa15801561094f573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109739190612fd3565b61097d9190612fc0565b90506109936001600160a01b0383168583611ac3565b505b5061099f81612fec565b905061078d565b50604051829084907f69c195e46a3c44152f8cc3e0dce44f866c72af30244de50adbb682169b9be82890600090a3505050565b60006109e481611b26565b6109f061013084611b30565b610a0d57604051630859dc9b60e31b815260040160405180910390fd5b6001600160a01b0383166000818152610133602052604080822080549086905590519092859284927f8410d72535b34c643f441072e096bcab068a9f0b8ec201b53151d7c258ae2fc99190a450505050565b600082815260fd6020526040902060010154610a7a81611b26565b610a848383611b52565b505050565b6001600160a01b0381163314610afe5760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201526e103937b632b9903337b91039b2b63360891b60648201526084015b60405180910390fd5b610b088282611bd8565b5050565b6001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000163003610b545760405162461bcd60e51b8152600401610af590613005565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316610b9d600080516020613251833981519152546001600160a01b031690565b6001600160a01b031614610bc35760405162461bcd60e51b8152600401610af590613051565b610bcc81611c3f565b60408051600080825260208201909252610be891839190611c4a565b50565b6000610bf681611b26565b6001600160a01b038216610c1d5760405163538ba4f960e01b815260040160405180910390fd5b61013680546001600160a01b038481166001600160a01b0319831681179093556040519116919082907fc1c3ef91edb36f64ef9c9ab3e23b09a247495d658881eff76aa94a1005745a0490600090a3505050565b600061074d61013083611b30565b6001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000163003610cc75760405162461bcd60e51b8152600401610af590613005565b7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316610d10600080516020613251833981519152546001600160a01b031690565b6001600160a01b031614610d365760405162461bcd60e51b8152600401610af590613051565b610d3f82611c3f565b610b0882826001611c4a565b6000306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614610deb5760405162461bcd60e51b815260206004820152603860248201527f555550535570677261646561626c653a206d757374206e6f742062652063616c60448201527f6c6564207468726f7567682064656c656761746563616c6c00000000000000006064820152608401610af5565b5060008051602061325183398151915290565b600054610100900460ff1615808015610e1e5750600054600160ff909116105b80610e385750303b158015610e38575060005460ff166001145b610e9b5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b6064820152608401610af5565b6000805460ff191660011790558015610ebe576000805461ff0019166101001790555b610f076040518060400160405280600e81526020016d5155414e54554d5f42524944474560901b815250604051806040016040528060018152602001603160f81b815250611db5565b610f12600088611b52565b610f3c7f5d8e12c39142ff96d79d04d15d1ba1269e4fe57bb9d26f43523628b34ba108ec87611b52565b61013580546001600160a01b038087166001600160a01b03199283161790925561013280548884169083161790556101348590556101368054928516929091169190911790558015610fc8576000805461ff0019169055604051600181527f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb38474024989060200160405180910390a15b50505050505050565b6060610fea610fe260005460ff1690565b60ff16611de6565b905090565b6000610ffa81611b26565b61271082111561101d5760405163ed612c4960e01b815260040160405180910390fd5b610134805490839055604051839082907f9215309fd52187744462ddfbcff9556949bb06929c3f04cab7e5a5b6f2a1a41790600090a3505050565b600061106381611b26565b61106f61013084611b30565b1561108d576040516302622f0960e31b815260040160405180910390fd5b61109961013084611e79565b506001600160a01b03831660008181526101336020526040808220859055518492917f6756363aa2b383dfef0b020fab6b1987d2779266c6d69b9e9264cf08469e8be991a3505050565b600091825260fd602090815260408084206001600160a01b0393909316845291905290205460ff1690565b600061111981611b26565b61112561013083611b30565b61114257604051630859dc9b60e31b815260040160405180910390fd5b61114e61013083611e8e565b506001600160a01b03821660008181526101336020526040808220829055517fed298cd8b8a2b6287606787aa2b43d7d16b75e64e3e7df5ec564bd551632c98f9190a25050565b6111a161013083611b30565b6111be57604051630859dc9b60e31b815260040160405180910390fd5b60006001600160a01b0383166111f45781156111ed576040516390af2b0160e01b815260040160405180910390fd5b5034611216565b3415611213576040516310c1e6eb60e31b815260040160405180910390fd5b50805b806000036112375760405163227fc67d60e11b815260040160405180910390fd5b600061124282611ea3565b905060006112508284612fc0565b905081856001600160a01b0316888860405161126d92919061309d565b604051908190038120428252907f70dd6fbdcac504ee9421b01564307eb9fe99fd199fc25aa44a6a48d8c21fd73d9060200160405180910390a46001600160a01b03851661133757801561133257610135546040516000916001600160a01b03169083908381818185875af1925050503d8060008114611309576040519150601f19603f3d011682016040523d82523d6000602084013e61130e565b606091505b505090508061133057604051634c67134d60e11b815260040160405180910390fd5b505b610fc8565b801561135a576101355461135a906001600160a01b038781169133911684611ecb565b610fc86001600160a01b038616333085611ecb565b61137b61013082611b30565b61139857604051630859dc9b60e31b815260040160405180910390fd5b6001600160a01b03811661146e576000805261013360205260008051602061329883398151915254471115611469576000808052610133602052600080516020613298833981519152546113ec9047612fc0565b610136546040519192506000916001600160a01b039091169083908381818185875af1925050503d806000811461143f576040519150601f19603f3d011682016040523d82523d6000602084013e611444565b606091505b505090508061146657604051634c67134d60e11b815260040160405180910390fd5b50505b611594565b6001600160a01b03811660008181526101336020526040908190205490516370a0823160e01b81523060048201529091906370a0823190602401602060405180830381865afa1580156114c5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114e99190612fd3565b1115611594576001600160a01b038116600081815261013360205260408082205490516370a0823160e01b8152306004820152919290916370a0823190602401602060405180830381865afa158015611546573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061156a9190612fd3565b6115749190612fc0565b61013654909150611592906001600160a01b03848116911683611ac3565b505b6040516001600160a01b038216907fb81fb1dcd93073b3d1d5667056721ee12c6d4a65e49237b259f88c464b519b9590600090a250565b6060610fea610130611f09565b600082815260fd60205260409020600101546115f381611b26565b610a848383611bd8565b600061160881611b26565b6001600160a01b03821661162f5760405163538ba4f960e01b815260040160405180910390fd5b61013580546001600160a01b038481166001600160a01b0319831681179093556040519116919082907f355f60d9ff6296cf38bdbcb90fd1c90d3f059557ff4e5249ebdc314a7e560db490600090a3505050565b600061168e81611b26565b6001600160a01b0382166116b55760405163538ba4f960e01b815260040160405180910390fd5b61013280546001600160a01b038481166001600160a01b0319831681179093556040519116919082907f23fd73fee3409773c469526b46c524a364c1bccb5aca33ff28f9b5e495db167b90600090a3505050565b7f5d8e12c39142ff96d79d04d15d1ba1269e4fe57bb9d26f43523628b34ba108ec61173381611b26565b610136546001600160a01b039081169084166117c3576000816001600160a01b03168460405160006040518083038185875af1925050503d8060008114611796576040519150601f19603f3d011682016040523d82523d6000602084013e61179b565b606091505b50509050806117bd57604051634c67134d60e11b815260040160405180910390fd5b506117d7565b6117d76001600160a01b0385168285611ac3565b60405183906001600160a01b0386169033907fa99b92949d52810b60a282250a088d4e9ce834cc91bd58037ef646135a7a945790600090a450505050565b6001600160a01b038716600090815261012f6020526040902054851461184e5760405163383851b960e21b815260040160405180910390fd5b61185a61013084611b30565b61187757604051630859dc9b60e31b815260040160405180910390fd5b8342111561189857604051632e21990560e11b815260040160405180910390fd5b604080517f30fae1c75801fe58fb12f53d14307ac589c4a3a80c08caf99fd861db5eb511aa60208201526001600160a01b03808a1692820192909252606081018890526080810187905260a0810186905290841660c082015260009060e001604051602081830303815290604052805190602001209050600061191a82611f16565b61013254604080516020601f88018190048102820181019092528681529293506001600160a01b039091169161196d918491908890889081908401838280828437600092019190915250611f6492505050565b6001600160a01b031614611994576040516315b94ee160e11b815260040160405180910390fd5b6001600160a01b038916600090815261012f602052604081208054916119b983612fec565b919050555087896001600160a01b0316866001600160a01b03167fbe91174e73e4053ea63e3d85c566bac9b889a12a77a8245c9c2bf6f7ef59117960405160405180910390a46001600160a01b038516611a87576000896001600160a01b03168960405160006040518083038185875af1925050503d8060008114611a5a576040519150601f19603f3d011682016040523d82523d6000602084013e611a5f565b606091505b5050905080611a8157604051634c67134d60e11b815260040160405180910390fd5b50611a9b565b611a9b6001600160a01b0386168a8a611ac3565b505050505050505050565b600061074d825490565b6000611abc8383611f88565b9392505050565b6040516001600160a01b038316602482015260448101829052610a8490849063a9059cbb60e01b906064015b60408051601f198184030181529190526020810180516001600160e01b03166001600160e01b031990931692909217909152611fb2565b610be88133612084565b6001600160a01b03811660009081526001830160205260408120541515611abc565b611b5c82826110e3565b610b0857600082815260fd602090815260408083206001600160a01b03851684529091529020805460ff19166001179055611b943390565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b611be282826110e3565b15610b0857600082815260fd602090815260408083206001600160a01b0385168085529252808320805460ff1916905551339285917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a45050565b6000610b0881611b26565b7f4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd91435460ff1615611c7d57610a84836120dd565b826001600160a01b03166352d1902d6040518163ffffffff1660e01b8152600401602060405180830381865afa925050508015611cd7575060408051601f3d908101601f19168201909252611cd491810190612fd3565b60015b611d3a5760405162461bcd60e51b815260206004820152602e60248201527f45524331393637557067726164653a206e657720696d706c656d656e7461746960448201526d6f6e206973206e6f74205555505360901b6064820152608401610af5565b6000805160206132518339815191528114611da95760405162461bcd60e51b815260206004820152602960248201527f45524331393637557067726164653a20756e737570706f727465642070726f786044820152681a58589b195555525160ba1b6064820152608401610af5565b50610a84838383612179565b600054610100900460ff16611ddc5760405162461bcd60e51b8152600401610af5906130ad565b610b08828261219e565b60606000611df3836121df565b600101905060008167ffffffffffffffff811115611e1357611e13612ca1565b6040519080825280601f01601f191660200182016040528015611e3d576020820181803683370190505b5090508181016020015b600019016f181899199a1a9b1b9c1cb0b131b232b360811b600a86061a8153600a8504945084611e4757509392505050565b6000611abc836001600160a01b0384166122b7565b6000611abc836001600160a01b038416612306565b60006127106101345483611eb791906130f8565b611ec1919061310f565b61074d9083612fc0565b6040516001600160a01b0380851660248301528316604482015260648101829052611f039085906323b872dd60e01b90608401611aef565b50505050565b60606000611abc836123f9565b600061074d611f23612455565b8360405161190160f01b6020820152602281018390526042810182905260009060620160405160208183030381529060405280519060200120905092915050565b6000806000611f7385856124d0565b91509150611f8081612515565b509392505050565b6000826000018281548110611f9f57611f9f613131565b9060005260206000200154905092915050565b6000612007826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b031661265f9092919063ffffffff16565b805190915015610a8457808060200190518101906120259190613147565b610a845760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b6064820152608401610af5565b61208e82826110e3565b610b085761209b81612676565b6120a6836020612688565b6040516020016120b7929190613169565b60408051601f198184030181529082905262461bcd60e51b8252610af591600401612e0a565b6001600160a01b0381163b61214a5760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b6064820152608401610af5565b60008051602061325183398151915280546001600160a01b0319166001600160a01b0392909216919091179055565b61218283612824565b60008251118061218f5750805b15610a8457611f038383612864565b600054610100900460ff166121c55760405162461bcd60e51b8152600401610af5906130ad565b815160209283012081519190920120606591909155606655565b60008072184f03e93ff9f4daa797ed6e38ed64bf6a1f0160401b831061221e5772184f03e93ff9f4daa797ed6e38ed64bf6a1f0160401b830492506040015b6d04ee2d6d415b85acef8100000000831061224a576d04ee2d6d415b85acef8100000000830492506020015b662386f26fc10000831061226857662386f26fc10000830492506010015b6305f5e1008310612280576305f5e100830492506008015b612710831061229457612710830492506004015b606483106122a6576064830492506002015b600a831061074d5760010192915050565b60008181526001830160205260408120546122fe5750815460018181018455600084815260208082209093018490558454848252828601909352604090209190915561074d565b50600061074d565b600081815260018301602052604081205480156123ef57600061232a600183612fc0565b855490915060009061233e90600190612fc0565b90508181146123a357600086600001828154811061235e5761235e613131565b906000526020600020015490508087600001848154811061238157612381613131565b6000918252602080832090910192909255918252600188019052604090208390555b85548690806123b4576123b46131de565b60019003818190600052602060002001600090559055856001016000868152602001908152602001600020600090556001935050505061074d565b600091505061074d565b60608160000180548060200260200160405190810160405280929190818152602001828054801561244957602002820191906000526020600020905b815481526020019060010190808311612435575b50505050509050919050565b6000610fea7f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f61248460655490565b6066546040805160208101859052908101839052606081018290524660808201523060a082015260009060c0016040516020818303038152906040528051906020012090509392505050565b60008082516041036125065760208301516040840151606085015160001a6124fa87828585612958565b9450945050505061250e565b506000905060025b9250929050565b6000816004811115612529576125296131f4565b036125315750565b6001816004811115612545576125456131f4565b036125925760405162461bcd60e51b815260206004820152601860248201527f45434453413a20696e76616c6964207369676e617475726500000000000000006044820152606401610af5565b60028160048111156125a6576125a66131f4565b036125f35760405162461bcd60e51b815260206004820152601f60248201527f45434453413a20696e76616c6964207369676e6174757265206c656e677468006044820152606401610af5565b6003816004811115612607576126076131f4565b03610be85760405162461bcd60e51b815260206004820152602260248201527f45434453413a20696e76616c6964207369676e6174757265202773272076616c604482015261756560f01b6064820152608401610af5565b606061266e8484600085612a1c565b949350505050565b606061074d6001600160a01b03831660145b606060006126978360026130f8565b6126a290600261320a565b67ffffffffffffffff8111156126ba576126ba612ca1565b6040519080825280601f01601f1916602001820160405280156126e4576020820181803683370190505b509050600360fc1b816000815181106126ff576126ff613131565b60200101906001600160f81b031916908160001a905350600f60fb1b8160018151811061272e5761272e613131565b60200101906001600160f81b031916908160001a90535060006127528460026130f8565b61275d90600161320a565b90505b60018111156127d5576f181899199a1a9b1b9c1cb0b131b232b360811b85600f166010811061279157612791613131565b1a60f81b8282815181106127a7576127a7613131565b60200101906001600160f81b031916908160001a90535060049490941c936127ce8161321d565b9050612760565b508315611abc5760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e746044820152606401610af5565b61282d816120dd565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606001600160a01b0383163b6128cc5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b6064820152608401610af5565b600080846001600160a01b0316846040516128e79190613234565b600060405180830381855af49150503d8060008114612922576040519150601f19603f3d011682016040523d82523d6000602084013e612927565b606091505b509150915061294f828260405180606001604052806027815260200161327160279139612af7565b95945050505050565b6000807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a083111561298f5750600090506003612a13565b6040805160008082526020820180845289905260ff881692820192909252606081018690526080810185905260019060a0016020604051602081039080840390855afa1580156129e3573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116612a0c57600060019250925050612a13565b9150600090505b94509492505050565b606082471015612a7d5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b6064820152608401610af5565b600080866001600160a01b03168587604051612a999190613234565b60006040518083038185875af1925050503d8060008114612ad6576040519150601f19603f3d011682016040523d82523d6000602084013e612adb565b606091505b5091509150612aec87838387612b10565b979650505050505050565b60608315612b06575081611abc565b611abc8383612b85565b60608315612b7f578251600003612b78576001600160a01b0385163b612b785760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401610af5565b508161266e565b61266e83835b815115612b955781518083602001fd5b8060405162461bcd60e51b8152600401610af59190612e0a565b600060208284031215612bc157600080fd5b81356001600160e01b031981168114611abc57600080fd5b60008060408385031215612bec57600080fd5b50508035926020909101359150565b80356001600160a01b0381168114612c1257600080fd5b919050565b600060208284031215612c2957600080fd5b611abc82612bfb565b60008060408385031215612c4557600080fd5b612c4e83612bfb565b946020939093013593505050565b600060208284031215612c6e57600080fd5b5035919050565b60008060408385031215612c8857600080fd5b82359150612c9860208401612bfb565b90509250929050565b634e487b7160e01b600052604160045260246000fd5b60008060408385031215612cca57600080fd5b612cd383612bfb565b9150602083013567ffffffffffffffff80821115612cf057600080fd5b818501915085601f830112612d0457600080fd5b813581811115612d1657612d16612ca1565b604051601f8201601f19908116603f01168101908382118183101715612d3e57612d3e612ca1565b81604052828152886020848701011115612d5757600080fd5b8260208601602083013760006020848301015280955050505050509250929050565b60008060008060008060c08789031215612d9257600080fd5b612d9b87612bfb565b9550612da960208801612bfb565b9450612db760408801612bfb565b9350612dc560608801612bfb565b925060808701359150612dda60a08801612bfb565b90509295509295509295565b60005b83811015612e01578181015183820152602001612de9565b50506000910152565b6020815260008251806020840152612e29816040850160208701612de6565b601f01601f19169190910160400192915050565b60008083601f840112612e4f57600080fd5b50813567ffffffffffffffff811115612e6757600080fd5b60208301915083602082850101111561250e57600080fd5b60008060008060608587031215612e9557600080fd5b843567ffffffffffffffff811115612eac57600080fd5b612eb887828801612e3d565b9095509350612ecb905060208601612bfb565b9396929550929360400135925050565b6020808252825182820181905260009190848201906040850190845b81811015612f1c5783516001600160a01b031683529284019291840191600101612ef7565b50909695505050505050565b600080600080600080600060c0888a031215612f4357600080fd5b612f4c88612bfb565b9650602088013595506040880135945060608801359350612f6f60808901612bfb565b925060a088013567ffffffffffffffff811115612f8b57600080fd5b612f978a828b01612e3d565b989b979a50959850939692959293505050565b634e487b7160e01b600052601160045260246000fd5b8181038181111561074d5761074d612faa565b600060208284031215612fe557600080fd5b5051919050565b600060018201612ffe57612ffe612faa565b5060010190565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b19195b1959d85d1958d85b1b60a21b606082015260800190565b6020808252602c908201527f46756e6374696f6e206d7573742062652063616c6c6564207468726f7567682060408201526b6163746976652070726f787960a01b606082015260800190565b8183823760009101908152919050565b6020808252602b908201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960408201526a6e697469616c697a696e6760a81b606082015260800190565b808202811582820484141761074d5761074d612faa565b60008261312c57634e487b7160e01b600052601260045260246000fd5b500490565b634e487b7160e01b600052603260045260246000fd5b60006020828403121561315957600080fd5b81518015158114611abc57600080fd5b7f416363657373436f6e74726f6c3a206163636f756e74200000000000000000008152600083516131a1816017850160208801612de6565b7001034b99036b4b9b9b4b733903937b6329607d1b60179184019182015283516131d2816028840160208801612de6565b01602801949350505050565b634e487b7160e01b600052603160045260246000fd5b634e487b7160e01b600052602160045260246000fd5b8082018082111561074d5761074d612faa565b60008161322c5761322c612faa565b506000190190565b60008251613246818460208701612de6565b919091019291505056fe360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a729f2b7e889b2ebf4d780e1fbffc38754bf520be086b132a2961d8dad3e68fea2646970667358221220fc69eb642bb9f537f29bfd8b04f17fee590319854112a2181a16e973da0dbe5d64736f6c63430008110033",
};

const BridgeProxyAbi = {
  abi: [
    {
      inputs: [
        {
          internalType: "address",
          name: "_logic",
          type: "address",
        },
        {
          internalType: "bytes",
          name: "_data",
          type: "bytes",
        },
      ],
      stateMutability: "payable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "previousAdmin",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "newAdmin",
          type: "address",
        },
      ],
      name: "AdminChanged",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "beacon",
          type: "address",
        },
      ],
      name: "BeaconUpgraded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "implementation",
          type: "address",
        },
      ],
      name: "Upgraded",
      type: "event",
    },
    {
      stateMutability: "payable",
      type: "fallback",
    },
    {
      stateMutability: "payable",
      type: "receive",
    },
  ],
  bytecode:
    "0x608060405260405161072b38038061072b8339810160408190526100229161031d565b818161003082826000610039565b5050505061043a565b6100428361006f565b60008251118061004f5750805b1561006a5761006883836100af60201b6100291760201c565b505b505050565b610078816100db565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606100d48383604051806060016040528060278152602001610704602791396101ad565b9392505050565b6100ee8161022660201b6100551760201c565b6101555760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b60648201526084015b60405180910390fd5b8061018c7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b61023560201b6100641760201c565b80546001600160a01b0319166001600160a01b039290921691909117905550565b6060600080856001600160a01b0316856040516101ca91906103eb565b600060405180830381855af49150503d8060008114610205576040519150601f19603f3d011682016040523d82523d6000602084013e61020a565b606091505b50909250905061021c86838387610238565b9695505050505050565b6001600160a01b03163b151590565b90565b606083156102a75782516000036102a0576001600160a01b0385163b6102a05760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015260640161014c565b50816102b1565b6102b183836102b9565b949350505050565b8151156102c95781518083602001fd5b8060405162461bcd60e51b815260040161014c9190610407565b634e487b7160e01b600052604160045260246000fd5b60005b838110156103145781810151838201526020016102fc565b50506000910152565b6000806040838503121561033057600080fd5b82516001600160a01b038116811461034757600080fd5b60208401519092506001600160401b038082111561036457600080fd5b818501915085601f83011261037857600080fd5b81518181111561038a5761038a6102e3565b604051601f8201601f19908116603f011681019083821181831017156103b2576103b26102e3565b816040528281528860208487010111156103cb57600080fd5b6103dc8360208301602088016102f9565b80955050505050509250929050565b600082516103fd8184602087016102f9565b9190910192915050565b60208152600082518060208401526104268160408501602087016102f9565b601f01601f19169190910160400192915050565b6102bb806104496000396000f3fe60806040523661001357610011610017565b005b6100115b610027610022610067565b61009f565b565b606061004e838360405180606001604052806027815260200161025f602791396100c3565b9392505050565b6001600160a01b03163b151590565b90565b600061009a7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546001600160a01b031690565b905090565b3660008037600080366000845af43d6000803e8080156100be573d6000f35b3d6000fd5b6060600080856001600160a01b0316856040516100e0919061020f565b600060405180830381855af49150503d806000811461011b576040519150601f19603f3d011682016040523d82523d6000602084013e610120565b606091505b50915091506101318683838761013b565b9695505050505050565b606083156101af5782516000036101a8576001600160a01b0385163b6101a85760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000060448201526064015b60405180910390fd5b50816101b9565b6101b983836101c1565b949350505050565b8151156101d15781518083602001fd5b8060405162461bcd60e51b815260040161019f919061022b565b60005b838110156102065781810151838201526020016101ee565b50506000910152565b600082516102218184602087016101eb565b9190910192915050565b602081526000825180602084015261024a8160408501602087016101eb565b601f01601f1916919091016040019291505056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a2646970667358221220d7880e7be7612890227376f52a0dd2029340dd7a6d2f9f9442f0ea09c1e5386964736f6c63430008110033416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564",
};

function toWei(amount) {
  return ethers.utils.parseEther(amount);
}

function hardhatRequest(method, params) {
  return axios
    .post(rpcURL, {
      // method: "POST",
      // body: JSON.stringify({
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 100000000000000),
      method,
      params,
      // }),
      headers: { "Content-Type": "application/json" },
    })
    .then((response) => response.data.result);
}

// Implementation is referred from /localContractsDeployment.ts
(async function deployTestTokenContract() {
  const accounts = await hardhatRequest("eth_accounts", []);

  const provider = new ethers.providers.JsonRpcProvider(rpcURL);
  const contractSigner = new ethers.Wallet(ETH_WALLET_PRIVATE_KEY, provider);

  // On local this is the accounts[0]
  const eoaAddress = accounts[0];
  console.log("Admin address: ", eoaAddress);
  console.log("Relayer address: ", eoaAddress);
  // On local this is the accounts[1]
  const withdrawSignerAddress = accounts[1];
  console.log("Withdraw address: ", withdrawSignerAddress);
  console.log("---------------------------------------------");

  const BridgeV1ERC20 = new ethers.ContractFactory(
    BridgeV1Abi.abi,
    BridgeV1Abi.bytecode,
    contractSigner
  );

  const bridgeV1 = await BridgeV1ERC20.deploy();
  await bridgeV1.deployed();
  console.log("Bridge V1 address is ", bridgeV1.address);

  // Bridge proxy
  const bridgeProxyContract = new ethers.ContractFactory(
    BridgeProxyAbi.abi,
    BridgeProxyAbi.bytecode,
    contractSigner
  );
  const TRANSACTION_FEE = 0;

  const encodedData = new ethers.utils.Interface(
    BridgeV1Abi.abi
  ).encodeFunctionData("initialize", [
    eoaAddress,
    withdrawSignerAddress,
    eoaAddress,
    accounts[3],
    TRANSACTION_FEE,
    accounts[4],
  ]);
  const bridgeProxy = await bridgeProxyContract.deploy(
    bridgeV1.address,
    encodedData
  );
  await bridgeProxy.deployed();
  console.log("Proxy address is ", bridgeProxy.address);

  const bridgeImplementationContract = bridgeV1.attach(bridgeProxy.address);

  const ERC20 = new ethers.ContractFactory(
    TestTokenAbi.abi,
    TestTokenAbi.bytecode,
    contractSigner
  );

  const tokenDFI = await ERC20.deploy("DFI", "DFI");
  await tokenDFI.deployed();
  console.log("Test DFI token is deployed to ", tokenDFI.address);

  const mockTokenWBTC = await ERC20.deploy("MockWBTC", "MWBTC"); // use {nonce:} if tx stuck
  await mockTokenWBTC.deployed();
  console.log("Test WMBTC token is deployed to ", mockTokenWBTC.address);

  const mockTokenUSDT = await ERC20.deploy("MockUSDT", "MUSDT"); // use {nonce:} if tx stuck
  await mockTokenUSDT.deployed();
  console.log("Test MUSDT token is deployed to ", mockTokenUSDT.address);

  const mockTokenUSDC = await ERC20.deploy("MockUSDC", "MUSDC");
  await mockTokenUSDC.deployed();
  console.log("Test MUSDC token is deployed to ", mockTokenUSDC.address);

  const mockTokenEUROC = await ERC20.deploy("MockEUROC", "MEUROC");
  await mockTokenEUROC.deployed();
  console.log("Test MEUROC token is deployed to ", mockTokenEUROC.address);

  // Minting 100_000 tokens to accounts[0]
  await tokenDFI.mint(eoaAddress, toWei("100000"));
  await mockTokenWBTC.mint(eoaAddress, toWei("100000"));
  await mockTokenUSDT.mint(eoaAddress, toWei("100000"));
  await mockTokenUSDC.mint(eoaAddress, toWei("100000"));
  await mockTokenEUROC.mint(eoaAddress, toWei("100000"));

  // Minting 100_000 tokens to hotwallet
  await tokenDFI.mint(bridgeProxy.address, toWei("100000"));
  await mockTokenWBTC.mint(bridgeProxy.address, toWei("100000"));
  await mockTokenUSDT.mint(bridgeProxy.address, toWei("100000"));
  await mockTokenUSDC.mint(bridgeProxy.address, toWei("100000"));
  await mockTokenEUROC.mint(bridgeProxy.address, toWei("100000"));

  // Approving max token to `bridgeProxyAddress` by accounts[0]
  await tokenDFI.approve(bridgeProxy.address, ethers.constants.MaxUint256);
  await mockTokenWBTC.approve(bridgeProxy.address, ethers.constants.MaxUint256);
  await mockTokenUSDT.approve(bridgeProxy.address, ethers.constants.MaxUint256);
  await mockTokenUSDC.approve(bridgeProxy.address, ethers.constants.MaxUint256);
  await mockTokenEUROC.approve(
    bridgeProxy.address,
    ethers.constants.MaxUint256
  );

  // Adding supported token
  await bridgeImplementationContract.addSupportedTokens(
    tokenDFI.address,
    ethers.constants.MaxUint256
  );
  await bridgeImplementationContract.addSupportedTokens(
    mockTokenWBTC.address,
    ethers.constants.MaxUint256
  );
  await bridgeImplementationContract.addSupportedTokens(
    mockTokenUSDT.address,
    ethers.constants.MaxUint256
  );
  await bridgeImplementationContract.addSupportedTokens(
    mockTokenUSDC.address,
    ethers.constants.MaxUint256
  );
  await bridgeImplementationContract.addSupportedTokens(
    mockTokenEUROC.address,
    ethers.constants.MaxUint256
  );
})();
