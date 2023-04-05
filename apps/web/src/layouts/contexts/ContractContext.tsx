import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { ContractContextI } from "types";
import { EnvironmentNetwork } from "@waveshq/walletkit-core";
import { useNetworkEnvironmentContext } from "./NetworkEnvironmentContext";
import {
  LOCAL_HARDHAT_CONFIG,
  MAINNET_CONFIG,
  TESTNET_CONFIG,
} from "../../config";

const ContractContext = createContext<ContractContextI>(undefined as any);

export function useContractContext(): ContractContextI {
  return useContext(ContractContext);
}

export function ContractProvider({
  children,
}: PropsWithChildren<{}>): JSX.Element | null {
  const { networkEnv } = useNetworkEnvironmentContext();
  const [config, setConfig] = useState(MAINNET_CONFIG);

  useEffect(() => {
    let contractConfig = TESTNET_CONFIG;
    if (networkEnv === EnvironmentNetwork.MainNet) {
      contractConfig = MAINNET_CONFIG;
    } else if (networkEnv === EnvironmentNetwork.LocalPlayground) {
      contractConfig = LOCAL_HARDHAT_CONFIG;
    }
    setConfig(contractConfig);
  }, [networkEnv]);

  return (
    <ContractContext.Provider value={config}>
      {children}
    </ContractContext.Provider>
  );
}
