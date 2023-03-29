import { ContractContextI } from "types";
import BridgeV1 from "./ABIs/mainnet/BridgeV1.json";
import BridgeV1Testnet from "./ABIs/testnet/BridgeV1.json";

export const MAINNET_CONFIG: ContractContextI = {
  EthereumRpcUrl:
    "https://mainnet.infura.io/v3/df267399d98e41e996d6588a76678d5e",
  ExplorerURL: "https://etherscan.io",
  BridgeV1: {
    address: "0x54346d39976629b65ba54eac1c9ef0af3be1921b",
    abi: BridgeV1,
  },
  HotWalletAddress: "df1qgq0rjw09hr6vr7sny2m55hkr5qgze5l9hcm0lg",
  Erc20Tokens: {
    WBTC: { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" },
    USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    ETH: { address: "0x0000000000000000000000000000000000000000" },
    EUROC: { address: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c" },
    DFI: { address: "0x8fc8f8269ebca376d046ce292dc7eac40c8d358a" },
  },
};

// Goerli
export const TESTNET_CONFIG: ContractContextI = {
  EthereumRpcUrl: "http://127.0.0.1:8545/",
  ExplorerURL: "https://goerli.etherscan.io",
  BridgeV1: {
    address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    abi: BridgeV1Testnet,
  },
  HotWalletAddress: "tf1qsckyp02vdzaf95cjl5dr95n8stcalze0pfswcp",
  Erc20Tokens: {
    WBTC: { address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" },
    USDT: { address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" },
    USDC: { address: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9" },
    ETH: { address: "0x0000000000000000000000000000000000000000" },
    EUROC: { address: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707" },
    DFI: { address: "0xe5442CC9BA0FF56E4E2Edae51129bF3A1b45d673" },
  },
};
