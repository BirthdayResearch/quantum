import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import { useRouter } from "next/router";
import { EnvironmentNetwork, getEnvironment } from "@waveshq/walletkit-core";

interface NetworkContextI {
  networkEnv: EnvironmentNetwork;
  networkEnvDisplayName: string;
  updateNetworkEnv: (networkEnv: EnvironmentNetwork) => void;
  resetNetworkEnv: () => void;
}
const NETWORK_ENV_DISPLAY_NAME: Record<EnvironmentNetwork, string> = {
  [EnvironmentNetwork.MainNet]: "MainNet",
  [EnvironmentNetwork.TestNet]: "TestNet",
  [EnvironmentNetwork.RemotePlayground]: "Local",
  [EnvironmentNetwork.DevNet]: "DevNet",
  [EnvironmentNetwork.LocalPlayground]: "Local",
};

const NetworkEnvironmentContext = createContext<NetworkContextI>(
  undefined as any
);

export function useNetworkEnvironmentContext(): NetworkContextI {
  return useContext(NetworkEnvironmentContext);
}

export function NetworkEnvironmentProvider({
  children,
}: PropsWithChildren<{}>): JSX.Element | null {
  const router = useRouter();
  const env = getEnvironment(process.env.NODE_ENV);
  const networkQuery = router.query.network;
  const initialNetwork = getNetwork(networkQuery as EnvironmentNetwork);
  const [networkEnv, setNetworkEnv] =
    useState<EnvironmentNetwork>(initialNetwork);
  const [networkEnvDisplayName, setNetworkEnvDisplayName] = useState<string>(
    NETWORK_ENV_DISPLAY_NAME[initialNetwork]
  );

  function getNetwork(n: EnvironmentNetwork): EnvironmentNetwork {
    if (env.networks.includes(n)) {
      return n;
    }
    return EnvironmentNetwork.MainNet;
  }

  const handleNetworkEnvChange = (value: EnvironmentNetwork) => {
    const networkDisplayName = NETWORK_ENV_DISPLAY_NAME[value];
    setNetworkEnv(value);
    setNetworkEnvDisplayName(networkDisplayName);
    if (value !== initialNetwork) {
      router.replace(
        {
          pathname: "/",
          query: { network: value },
        },
        undefined,
        { shallow: true }
      );
    }
  };

  const resetNetworkEnv = () => {
    handleNetworkEnvChange(initialNetwork);
  };

  useEffect(() => {
    setNetworkEnv(initialNetwork);
    setNetworkEnvDisplayName(NETWORK_ENV_DISPLAY_NAME[initialNetwork]);
  }, [initialNetwork]);

  const context: NetworkContextI = useMemo(
    () => ({
      networkEnv,
      networkEnvDisplayName,
      updateNetworkEnv: handleNetworkEnvChange,
      resetNetworkEnv,
    }),
    [networkEnv]
  );

  return (
    <NetworkEnvironmentContext.Provider value={context}>
      {children}
    </NetworkEnvironmentContext.Provider>
  );
}
