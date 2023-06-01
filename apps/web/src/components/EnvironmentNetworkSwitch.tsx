import { useEffect } from "react";
import clsx from "clsx";
import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import { EnvironmentNetwork } from "@waveshq/walletkit-core";
import { useSwitchNetwork, useNetwork } from "wagmi";
import { ETHEREUM_MAINNET_ID, ETHEREUM_TESTNET_ID } from "../constants";

export default function EnvironmentNetworkSwitch({
  disabled = false,
}: {
  disabled?: boolean;
}): JSX.Element {
  const { networkEnv: currentNetworkEnv, updateNetworkEnv } =
    useNetworkEnvironmentContext();
  const { switchNetwork } = useSwitchNetwork();
  const { chain } = useNetwork();

  useEffect(() => {
    updateNetworkEnv(
      chain === undefined || chain?.id === ETHEREUM_MAINNET_ID
        ? EnvironmentNetwork.MainNet
        : EnvironmentNetwork.TestNet
    );
  }, [chain]);

  const handleOnClick = async () => {
    const isProduction = process.env.NODE_ENV === "production";
    let nextNetworkEnv: EnvironmentNetwork;
    switch (currentNetworkEnv) {
      case EnvironmentNetwork.TestNet:
        if (isProduction) {
          nextNetworkEnv = EnvironmentNetwork.MainNet;
          switchNetwork?.(ETHEREUM_MAINNET_ID);
        } else {
          nextNetworkEnv = EnvironmentNetwork.LocalPlayground;
          switchNetwork?.(ETHEREUM_TESTNET_ID);
        }
        break;
      case EnvironmentNetwork.LocalPlayground:
        nextNetworkEnv = EnvironmentNetwork.MainNet;
        switchNetwork?.(ETHEREUM_MAINNET_ID);
        break;
      case EnvironmentNetwork.MainNet:
      default:
        nextNetworkEnv = EnvironmentNetwork.TestNet;
        switchNetwork?.(ETHEREUM_TESTNET_ID);
        break;
    }
    updateNetworkEnv(nextNetworkEnv);
  };

  return (
    <button
      data-testid="network-env-switch"
      type="button"
      className={clsx(
        "flex items-center rounded-[37px] dark-section-bg border border-dark-card-stroke px-3 py-2 hover:dark-btn-hover hover:border-dark-500",
        {
          "pointer-events-none": disabled,
        }
      )}
      onClick={handleOnClick}
      disabled={disabled}
    >
      <div
        className={clsx(
          "w-2 h-2 rounded-full mr-1",
          currentNetworkEnv === EnvironmentNetwork.MainNet
            ? "bg-valid"
            : "bg-warning"
        )}
      />
      <span className="text-dark-1000 text-2xs font-bold tracking-widest uppercase">
        {currentNetworkEnv}
      </span>
    </button>
  );
}
