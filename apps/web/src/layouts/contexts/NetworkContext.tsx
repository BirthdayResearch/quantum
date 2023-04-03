import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  PropsWithChildren,
  useEffect,
} from "react";
import { useNetwork } from "wagmi";
import { useBridgeSettingsQuery } from "@store/index";
import { Erc20Token, Network, TokenDetailI, TokensI } from "types";

interface NetworkContextI {
  isTokensAvailable: boolean;
  evmFee: string | number;
  dfcFee: string | number;
  filteredNetwork: [NetworkI<Erc20Token>, NetworkI<string>];
}

export interface NetworkI<T> {
  name: Network;
  icon: string;
  tokens: {
    tokenA: TokenDetailI<T>;
    tokenB: TokenDetailI<string>;
  }[];
}
export const networks: [NetworkI<Erc20Token>, NetworkI<string>] = [
  {
    name: Network.Ethereum,
    icon: "/tokens/Ethereum.svg",
    tokens: [
      {
        tokenA: {
          name: "DFI",
          subtitle: "(Ethereum)",
          symbol: "DFI",
          icon: "/tokens/DFI.svg",
        },
        tokenB: {
          name: "DFI",
          symbol: "DFI",
          icon: "/tokens/DFI.svg",
        },
      },
      {
        tokenA: {
          name: "WBTC",
          symbol: "WBTC",
          icon: "/tokens/wBTC.svg",
        },
        tokenB: {
          name: "dBTC",
          symbol: "BTC",
          icon: "/tokens/dBTC.svg",
        },
      },
      {
        tokenA: {
          name: "ETH",
          symbol: "ETH",
          icon: "/tokens/ETH.svg",
        },
        tokenB: {
          name: "dETH",
          symbol: "ETH",
          icon: "/tokens/dETH.svg",
        },
      },
      {
        tokenA: {
          name: "USDT",
          symbol: "USDT",
          icon: "/tokens/USDT.svg",
        },
        tokenB: {
          name: "dUSDT",
          symbol: "USDT",
          icon: "/tokens/dUSDT.svg",
        },
      },
      {
        tokenA: {
          name: "USDC",
          symbol: "USDC",
          icon: "/tokens/USDC.svg",
        },
        tokenB: {
          name: "dUSDC",
          symbol: "USDC",
          icon: "/tokens/dUSDC.svg",
        },
      },
      {
        tokenA: {
          name: "EUROC",
          symbol: "EUROC",
          icon: "/tokens/EUROC.svg",
        },
        tokenB: {
          name: "dEUROC",
          symbol: "EUROC",
          icon: "/tokens/dEUROC.svg",
        },
      },
    ],
  },
  {
    name: Network.DeFiChain,
    icon: "/tokens/DeFichain.svg",
    tokens: [
      {
        tokenA: {
          name: "DFI",
          symbol: "DFI",
          icon: "/tokens/DFI.svg",
        },
        tokenB: {
          name: "DFI",
          subtitle: "(Ethereum)",
          symbol: "DFI",
          icon: "/tokens/DFI.svg",
        },
      },
      {
        tokenA: {
          name: "dBTC",
          symbol: "BTC",
          icon: "/tokens/dBTC.svg",
        },
        tokenB: {
          name: "WBTC",
          symbol: "WBTC",
          icon: "/tokens/wBTC.svg",
        },
      },
      {
        tokenA: {
          name: "dETH",
          symbol: "ETH",
          icon: "/tokens/dETH.svg",
        },
        tokenB: {
          name: "ETH",
          symbol: "ETH",
          icon: "/tokens/ETH.svg",
        },
      },
      {
        tokenA: {
          name: "dUSDT",
          symbol: "USDT",
          icon: "/tokens/dUSDT.svg",
        },
        tokenB: {
          name: "USDT",
          symbol: "USDT",
          icon: "/tokens/USDT.svg",
        },
      },
      {
        tokenA: {
          name: "dUSDC",
          symbol: "USDC",
          icon: "/tokens/dUSDC.svg",
        },
        tokenB: {
          name: "USDC",
          symbol: "USDC",
          icon: "/tokens/USDC.svg",
        },
      },
      {
        tokenA: {
          name: "dEUROC",
          symbol: "EUROC",
          icon: "/tokens/dEUROC.svg",
        },
        tokenB: {
          name: "EUROC",
          symbol: "EUROC",
          icon: "/tokens/EUROC.svg",
        },
      },
    ],
  },
];
const NetworkContext = createContext<NetworkContextI>(undefined as any);
export function useNetworkContext(): NetworkContextI {
  return useContext(NetworkContext);
}

export function NetworkProvider({
  children,
}: PropsWithChildren<{}>): JSX.Element | null {
  const { chain } = useNetwork();
  const [isTokensAvailable, setIsTokensAvailable] = useState<boolean>(false);
  const [dfcFee, setDfcFee] = useState<`${number}` | number>(0);
  const [evmFee, setEvmFee] = useState<`${number}` | number>(0);
  const [filteredNetwork, setFilteredNetwork] =
    useState<[NetworkI<Erc20Token>, NetworkI<string>]>(networks);
  const { data } = useBridgeSettingsQuery();

  useEffect(() => {
    if (data) {
      setDfcFee(data.defichain.transferFee);
      setEvmFee(data.ethereum.transferFee);

      const matchedNetworks = networks.map((network) => {
        const supportedToken =
          network.name === Network.DeFiChain
            ? data?.defichain.supportedTokens
            : data?.ethereum.supportedTokens;

        let tokenMatcher: TokensI[] = [];
        if (supportedToken !== undefined) {
          tokenMatcher = network.tokens.filter((token) =>
            supportedToken.includes(token.tokenA.symbol)
          );
        }
        return {
          ...network,
          tokens: tokenMatcher,
        };
      });

      if (matchedNetworks) {
        setFilteredNetwork(
          matchedNetworks as [NetworkI<Erc20Token>, NetworkI<string>]
        );
      }

      setIsTokensAvailable(true);
    }
  }, [data, chain]);

  const context: NetworkContextI = useMemo(
    () => ({
      isTokensAvailable,
      evmFee,
      dfcFee,
      filteredNetwork,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredNetwork, chain, data]
  );

  return (
    <NetworkContext.Provider value={context}>
      {isTokensAvailable ? children : null}
    </NetworkContext.Provider>
  );
}
