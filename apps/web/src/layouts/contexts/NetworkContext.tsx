import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  PropsWithChildren,
  useEffect,
} from "react";
import {
  Erc20Token,
  Network,
  NetworkOptionsI,
  TokenDetailI,
  TokensI,
} from "types";

interface NetworkContextI {
  supportedNetworksTokens: [NetworkI<Erc20Token>, NetworkI<string>];
  selectedNetworkA: NetworkOptionsI;
  selectedTokensA: TokensI;
  selectedNetworkB: NetworkOptionsI;
  selectedTokensB: TokensI;
  setSelectedNetworkA: (networkA: NetworkOptionsI) => void;
  setSelectedTokensA: (tokenA: TokensI) => void;
  setSelectedNetworkB: (networkB: NetworkOptionsI) => void;
  setSelectedTokensB: (tokenB: TokensI) => void;
  resetNetworkSelection: () => void;
}

export interface NetworkI<T> {
  name: Network;
  tokens: {
    tokenA: TokenDetailI<T>;
    tokenB: TokenDetailI<string>;
  }[];
}

export const FALLBACK_SUPPORTED_TOKENS_LIST: [
  NetworkI<Erc20Token>,
  NetworkI<string>
] = [
  {
    name: Network.Ethereum,
    tokens: [
      {
        tokenA: {
          name: "DFI",
          subtitle: "(Ethereum)",
          symbol: "DFI",
        },
        tokenB: {
          name: "DFI",
          symbol: "DFI",
        },
      },
    ],
  },
  {
    name: Network.DeFiChain,
    tokens: [
      {
        tokenA: {
          name: "DFI",
          symbol: "DFI",
        },
        tokenB: {
          name: "DFI",
          subtitle: "(Ethereum)",
          symbol: "DFI",
        },
      },
    ],
  },
];

const NetworkContext = createContext<NetworkContextI>(undefined as any);

export function useNetworkContext(): NetworkContextI {
  return useContext(NetworkContext);
}

interface NetworkProviderProps {
  supportedTokens: [NetworkI<Erc20Token>, NetworkI<string>];
}

export function NetworkProvider({
  children,
  supportedTokens = FALLBACK_SUPPORTED_TOKENS_LIST,
}: PropsWithChildren<NetworkProviderProps>): JSX.Element | null {
  const supportedNetworksTokens =
    supportedTokens.length > 0
      ? supportedTokens
      : FALLBACK_SUPPORTED_TOKENS_LIST;
  const [defaultNetworkA, defaultNetworkB] = supportedNetworksTokens;
  const [selectedNetworkA, setSelectedNetworkA] =
    useState<NetworkOptionsI>(defaultNetworkA);
  const [selectedTokensA, setSelectedTokensA] = useState<TokensI>(
    defaultNetworkA.tokens[0]
  );
  const [selectedNetworkB, setSelectedNetworkB] =
    useState<NetworkOptionsI>(defaultNetworkB);
  const [selectedTokensB, setSelectedTokensB] = useState<TokensI>(
    defaultNetworkB.tokens[0]
  );

  useEffect(() => {
    const networkB = supportedNetworksTokens.find(
      (network) => network.name !== selectedNetworkA.name
    );
    if (networkB !== undefined) {
      setSelectedNetworkB(networkB);
      const tokens = selectedNetworkA.tokens.find(
        (item) => item.tokenA.name === selectedTokensB.tokenA.name
      );
      if (tokens !== undefined) {
        setSelectedTokensA(tokens);
      }
    }
  }, [selectedNetworkA]);

  useEffect(() => {
    const tokens = selectedNetworkB.tokens.find(
      (item) => item.tokenA.name === selectedTokensA.tokenB.name
    );
    if (tokens !== undefined) {
      setSelectedTokensB(tokens);
    }
  }, [selectedTokensA]);

  const resetNetworkSelection = () => {
    setSelectedNetworkA(defaultNetworkA);
    setSelectedTokensA(defaultNetworkA.tokens[0]);
    setSelectedNetworkB(defaultNetworkB);
    setSelectedTokensB(defaultNetworkB.tokens[0]);
  };

  const context: NetworkContextI = useMemo(
    () => ({
      supportedNetworksTokens,
      selectedNetworkA,
      selectedTokensA,
      selectedNetworkB,
      selectedTokensB,
      setSelectedNetworkA,
      setSelectedTokensA,
      setSelectedNetworkB,
      setSelectedTokensB,
      resetNetworkSelection,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedTokensA, selectedTokensB]
  );

  return (
    <NetworkContext.Provider value={context}>
      {children}
    </NetworkContext.Provider>
  );
}
