import React, {
  createContext,
  useEffect,
  useState,
  useMemo,
  useContext,
  PropsWithChildren,
} from "react";
import { ethers, utils } from "ethers";
import { DailyLimiterContextI } from "types";
import { useNetworkContext } from "@contexts/NetworkContext";
import { useContractContext } from "@contexts/ContractContext";

const DailyLimiterContext = createContext(undefined as any);

export function useDailyLimiterContext(): DailyLimiterContextI {
  return useContext(DailyLimiterContext);
}

export function DailyLimiterProvider({
  children,
}: PropsWithChildren<{}>): JSX.Element | null {
  const { selectedTokensB, isSendingErcToken } = useNetworkContext();
  const { BridgeV1, EthereumRpcUrl, Erc20Tokens } = useContractContext();

  const provider = new ethers.providers.JsonRpcProvider(EthereumRpcUrl);
  const bridgeContract = new ethers.Contract(
    BridgeV1.address,
    BridgeV1.abi,
    provider
  );

  const [dailyLimit, setDailyLimit] = useState<string>("0");
  const [currentUsage, setCurrentUsage] = useState<string>("0");

  const tokenAllowances = async () => {
    try {
      const result = await bridgeContract.tokenAllowances(
        Erc20Tokens[selectedTokensB.tokenB.name].address
      );
      return result;
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    if (isSendingErcToken) {
      const updateTokenData = async () => {
        const result = await tokenAllowances();
        if (result) {
          setDailyLimit(
            utils.formatEther(
              ethers.BigNumber.from(result?.dailyAllowance.toHexString())
            )
          );
          setCurrentUsage(
            utils.formatEther(
              ethers.BigNumber.from(result.currentDailyUsage.toHexString())
            )
          );
        }
      };
      updateTokenData();
    }

    if (!isSendingErcToken) {
      //  TODO: To replace this with DFC > EVM limiter
      setDailyLimit("0");
      setCurrentUsage("0");
    }
  }, [selectedTokensB, isSendingErcToken]);

  const LimiterData: DailyLimiterContextI = useMemo(
    () => ({ dailyLimit, currentUsage }),
    [dailyLimit, currentUsage]
  );

  return (
    <DailyLimiterContext.Provider value={LimiterData}>
      {children}
    </DailyLimiterContext.Provider>
  );
}
