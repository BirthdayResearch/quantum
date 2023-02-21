import { ContractContextI } from "types";
import BridgeV1 from "./ABIs/mainnet/BridgeV1.json";
import BridgeV1Testnet from "./ABIs/testnet/BridgeV1.json";

export const MAINNET_CONFIG: ContractContextI = {
  EthereumRpcUrl: "https://cloudflare-eth.com/", // TODO: Replace with MainNet RPC URL
  ExplorerURL: "https://etherscan.io",
  BridgeV1: {
    address: "0x96E5E1d6377ffA08B9c08B066f430e33e3c4C9ef", // TODO: Replace with deployed contract address on mainnet
    abi: BridgeV1,
  },
  Erc20Tokens: {
    wBTC: { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" },
    USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    ETH: {
      address: "0x0000000000000000000000000000000000000000",
    },
  },
};

// Goerli
export const TESTNET_CONFIG: ContractContextI = {
  EthereumRpcUrl: "https://rpc.ankr.com/eth_goerli",
  ExplorerURL: "https://goerli.etherscan.io",
  BridgeV1: {
    address: "0x96E5E1d6377ffA08B9c08B066f430e33e3c4C9ef",
    abi: BridgeV1Testnet,
  },
  Erc20Tokens: {
    wBTC: { address: "0xD723D679d1A3b23d0Aafe4C0812f61DDA84fc043" },
    USDT: { address: "0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF" },
    USDC: { address: "0xB200af2b733B831Fbb3d98b13076BC33F605aD58" },
    ETH: {
      address: "0x0000000000000000000000000000000000000000",
    },
  },
};
