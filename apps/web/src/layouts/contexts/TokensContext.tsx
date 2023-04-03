import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  PropsWithChildren,
  useEffect,
} from "react";
import { NetworkOptionsI, TokensI } from "types";

import { useNetworkContext } from "@contexts/NetworkContext";

interface TokenContextI {
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

const TokensContext = createContext<TokenContextI>(undefined as any);
export function useTokensContext(): TokenContextI {
  return useContext(TokensContext);
}

export function TokensProvider({ children }: PropsWithChildren<{}>) {
  const { filteredNetwork } = useNetworkContext();

  const [defaultNetworkA, defaultNetworkB] = filteredNetwork;
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
    const networkB = filteredNetwork.find(
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
  }, [selectedNetworkA, filteredNetwork]);

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

  const handleFilteredNetworkChange = () => {
    if (
      defaultNetworkA.name !== selectedNetworkA.name ||
      defaultNetworkB.name !== selectedNetworkB.name
    ) {
      resetNetworkSelection();
    }
  };

  useMemo(() => handleFilteredNetworkChange(), [filteredNetwork]);

  const context: TokenContextI = useMemo(
    () => ({
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
    [selectedNetworkA, selectedTokensA, selectedTokensB]
  );
  return (
    <TokensContext.Provider value={context}>{children}</TokensContext.Provider>
  );
}
