import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import { ContractContextI, NetworkEnvironment } from "types";
import { useNetworkEnvironmentContext } from "./NetworkEnvironmentContext";
import { MAINNET_CONFIG, TESTNET_CONFIG } from "../../config/contractAddresses";

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
    const contractConfig =
      networkEnv === NetworkEnvironment.mainnet
        ? MAINNET_CONFIG
        : TESTNET_CONFIG;
    setConfig(contractConfig);
  }, [networkEnv]);

  return (
    <ContractContext.Provider value={config}>
      {children}
    </ContractContext.Provider>
  );
}
