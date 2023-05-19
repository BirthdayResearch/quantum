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

export interface NetworkContextI {
  supportedNetworksTokens: [NetworkI<Erc20Token>, NetworkI<string>];
  selectedNetworkA: NetworkOptionsI;
  selectedTokensA: TokensI;
  selectedNetworkB: NetworkOptionsI;
  selectedTokensB: TokensI;
  setSelectedNetworkA: (networkA: NetworkOptionsI) => void;
  setSelectedTokensA: (tokenA: TokensI) => void;
  setSelectedNetworkB: (networkB: NetworkOptionsI) => void;
  setSelectedTokensB: (tokenB: TokensI) => void;
  selectedQueueNetworkA: NetworkOptionsI;
  selectedQueueTokensA: TokensI;
  selectedQueueNetworkB: NetworkOptionsI;
  typeOfTransaction: FormOptions;
  selectedQueueTokensB: TokensI;
  setSelectedQueueNetworkA: (networkA: NetworkOptionsI) => void;
  setSelectedQueueTokensA: (tokenA: TokensI) => void;
  setSelectedQueueNetworkB: (networkB: NetworkOptionsI) => void;
  setSelectedQueueTokensB: (tokenB: TokensI) => void;
  setTypeOfTransaction: (transactionType: FormOptions) => void;

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
export enum FormOptions {
  INSTANT = "Instant",
  QUEUE = "Queue",
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
  const [typeOfTransaction, setTypeOfTransaction] = useState<FormOptions>(
    FormOptions.INSTANT
  );
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

  // Queue
  const [defaultQueueNetworkA, defaultQueueNetworkB] = supportedNetworksTokens;
  const [selectedQueueNetworkA, setSelectedQueueNetworkA] =
    useState<NetworkOptionsI>(defaultQueueNetworkA);
  const [selectedQueueTokensA, setSelectedQueueTokensA] = useState<TokensI>(
    defaultQueueNetworkA.tokens[0]
  );
  const [selectedQueueNetworkB, setSelectedQueueNetworkB] =
    useState<NetworkOptionsI>(defaultQueueNetworkB);
  const [selectedQueueTokensB, setSelectedQueueTokensB] = useState<TokensI>(
    defaultQueueNetworkB.tokens[0]
  );

  // To get form config depending on the FormOption if its Instant or Queue
  function getFormConfigs() {
    let selectedFormNetworkA;
    let setFormSelectedNetworkB;
    let setFormSelectedTokensA;
    let selectedFormTokensB;

    let selectedFormNetworkB;
    let selectedFormTokensA;
    let setFormSelectedTokensB;

    if (typeOfTransaction === FormOptions.INSTANT) {
      selectedFormNetworkA = selectedNetworkA;
      setFormSelectedNetworkB = setSelectedNetworkB;
      setFormSelectedTokensA = setSelectedTokensA;
      selectedFormTokensB = selectedTokensB;

      selectedFormNetworkB = selectedNetworkB;
      selectedFormTokensA = selectedTokensA;
      setFormSelectedTokensB = setSelectedTokensB;
    } else {
      selectedFormNetworkA = selectedQueueNetworkA;
      setFormSelectedNetworkB = setSelectedQueueNetworkB;
      setFormSelectedTokensA = setSelectedQueueTokensA;
      selectedFormTokensB = selectedQueueTokensB;

      selectedFormNetworkB = selectedQueueNetworkB;
      selectedFormTokensA = selectedQueueTokensA;
      setFormSelectedTokensB = setSelectedQueueTokensB;
    }

    return {
      selectedFormNetworkA,
      setFormSelectedNetworkB,
      setFormSelectedTokensA,
      selectedFormTokensB,
      selectedFormNetworkB,
      selectedFormTokensA,
      setFormSelectedTokensB,
    };
  }

  useEffect(() => {
    const {
      selectedFormNetworkA,
      setFormSelectedNetworkB,
      setFormSelectedTokensA,
      selectedFormTokensB,
    } = getFormConfigs();

    const networkB = supportedNetworksTokens.find(
      (network) => network.name !== selectedFormNetworkA.name
    );
    if (networkB !== undefined) {
      setFormSelectedNetworkB(networkB);
      const tokens = selectedFormNetworkA.tokens.find(
        (item) => item.tokenA.name === selectedFormTokensB.tokenA.name
      );
      if (tokens !== undefined) {
        setFormSelectedTokensA(tokens);
      }
    }
  }, [selectedNetworkA, selectedQueueNetworkA, typeOfTransaction]);

  useEffect(() => {
    const {
      selectedFormNetworkB,
      selectedFormTokensA,
      setFormSelectedTokensB,
    } = getFormConfigs();

    const tokens = selectedFormNetworkB.tokens.find(
      (item) => item.tokenA.name === selectedFormTokensA.tokenB.name
    );
    if (tokens !== undefined) {
      setFormSelectedTokensB(tokens);
    }
  }, [selectedTokensA, selectedQueueTokensA, typeOfTransaction]);

  const resetNetworkSelection = () => {
    setSelectedNetworkA(defaultNetworkA);
    setSelectedTokensA(defaultNetworkA.tokens[0]);
    setSelectedNetworkB(defaultNetworkB);
    setSelectedTokensB(defaultNetworkB.tokens[0]);

    // Queue
    setSelectedQueueNetworkA(defaultQueueNetworkA);
    setSelectedQueueTokensA(defaultQueueNetworkA.tokens[0]);
    setSelectedQueueNetworkB(defaultQueueNetworkB);
    setSelectedQueueTokensB(defaultQueueNetworkB.tokens[0]);
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

      selectedQueueNetworkA,
      selectedQueueTokensA,
      selectedQueueNetworkB,
      selectedQueueTokensB,
      setSelectedQueueNetworkA,
      setSelectedQueueTokensA,
      setSelectedQueueNetworkB,
      setSelectedQueueTokensB,

      typeOfTransaction,
      setTypeOfTransaction,
      resetNetworkSelection,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      selectedTokensA,
      selectedTokensB,
      selectedQueueTokensA,
      selectedQueueTokensB,
      typeOfTransaction,
    ]
  );

  return (
    <NetworkContext.Provider value={context}>
      {children}
    </NetworkContext.Provider>
  );
}
