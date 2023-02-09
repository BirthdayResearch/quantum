import { ContractContextI } from "types";
import BridgeV1 from "./ABIs/mainnet/BridgeV1.json";
import BridgeV1Testnet from "./ABIs/testnet/BridgeV1.json";

export const MAINNET_CONFIG: ContractContextI = {
  ExplorerURL: "https://etherscan.io",
  BridgeV1: {
    address: "0x93fE70235854e7c97A5db5ddfC6eAAb078e99d3C",
    abi: BridgeV1, // TODO: Replace with deployed contract address on mainnet
  },
  Erc20Tokens: {
    wBTC: { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" },
    USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    wETH: { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
  },
};

// Goerli
export const TESTNET_CONFIG: ContractContextI = {
  ExplorerURL: "https://goerli.etherscan.io",
  BridgeV1: {
    address: "0x93fE70235854e7c97A5db5ddfC6eAAb078e99d3C",
    abi: BridgeV1Testnet,
  },
  Erc20Tokens: {
    wBTC: { address: "0xD723D679d1A3b23d0Aafe4C0812f61DDA84fc043" },
    USDT: { address: "0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF" },
    USDC: { address: "0xB200af2b733B831Fbb3d98b13076BC33F605aD58" },
    wETH: { address: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6" },
  },
};
