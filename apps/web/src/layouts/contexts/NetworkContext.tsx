import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  Network,
  NetworkOptionsI,
  TokenDetailI,
  TokensI,
  Erc20Token,
} from "types";

interface NetworkContextI {
  supportedTokens: [NetworkI<Erc20Token>, NetworkI<string>];
  selectedNetworkA: NetworkOptionsI | null;
  selectedTokensA: TokensI | null;
  selectedNetworkB: NetworkOptionsI | null;
  selectedTokensB: TokensI | null;
  setSelectedNetworkA: (networkA: NetworkOptionsI | null) => void;
  setSelectedTokensA: (tokenA: TokensI | null) => void;
  setSelectedNetworkB: (networkB: NetworkOptionsI | null) => void;
  setSelectedTokensB: (tokenB: TokensI | null) => void;
  resetNetworkSelection: () => void;
}

export interface NetworkI<T> {
  name: Network;
  icon: string;
  tokens: {
    tokenA: TokenDetailI<T>;
    tokenB: TokenDetailI<string>;
  }[];
}

const NetworkContext = createContext<NetworkContextI>(undefined as any);

export function useNetworkContext(): NetworkContextI {
  return useContext(NetworkContext);
}

interface NetworkProviderProps {
  children: React.ReactNode;
  supportedTokens: [NetworkI<Erc20Token>, NetworkI<string>];
}

export function NetworkProvider({
  children,
  supportedTokens,
}: NetworkProviderProps): JSX.Element | null {
  // Provide defaults if no supportedTokens are passed in.
  const [defaultNetworkA = null, defaultNetworkB = null] =
    supportedTokens || [];

  const [selectedNetworkA, setSelectedNetworkA] =
    useState<NetworkOptionsI | null>(defaultNetworkA);
  const [selectedTokensA, setSelectedTokensA] = useState<TokensI | null>(
    defaultNetworkA?.tokens[0] || null
  );
  const [selectedNetworkB, setSelectedNetworkB] =
    useState<NetworkOptionsI | null>(defaultNetworkB);
  const [selectedTokensB, setSelectedTokensB] = useState<TokensI | null>(
    defaultNetworkB?.tokens[0] || null
  );

  useEffect(() => {
    if (supportedTokens) {
      const networkB = supportedTokens.find(
        (network) => network.name !== selectedNetworkA?.name
      );
      if (networkB !== undefined) {
        setSelectedNetworkB(networkB);
        const tokens = selectedNetworkA?.tokens.find(
          (item) => item.tokenA.name === selectedTokensB?.tokenA.name
        );
        if (tokens !== undefined) {
          setSelectedTokensA(tokens);
        }
      }
    }
  }, [selectedNetworkA, supportedTokens]);

  useEffect(() => {
    if (supportedTokens) {
      const tokens = selectedNetworkB?.tokens.find(
        (item) => item.tokenA.name === selectedTokensA?.tokenB.name
      );
      if (tokens !== undefined) {
        setSelectedTokensB(tokens);
      }
    }
  }, [selectedTokensA, supportedTokens]);

  const resetNetworkSelection = () => {
    setSelectedNetworkA(defaultNetworkA);
    setSelectedTokensA(defaultNetworkA?.tokens[0] || null);
    setSelectedNetworkB(defaultNetworkB);
    setSelectedTokensB(defaultNetworkB?.tokens[0] || null);
  };

  const context: NetworkContextI = useMemo(
    () => ({
      supportedTokens,
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
