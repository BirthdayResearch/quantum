import Logging from "@api/logging";
import { useNetworkContext } from "@contexts/NetworkContext";
import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import { useBalanceDfcMutation, useBalanceEvmMutation } from "@store/index";
import { useEffect, useState } from "react";
import { Network } from "types";

export default function useCheckBalance(symbol: string) {
  const [balanceAmount, setBalanceAmount] = useState<string>("0");

  const [balanceEvm] = useBalanceEvmMutation();
  const [balanceDfc] = useBalanceDfcMutation();

  const { selectedNetworkA, selectedTokensA } = useNetworkContext();
  const { networkEnv } = useNetworkEnvironmentContext();

  /**
   * When sending from EVM -> DFC, check that DFC wallet has enough balance;
   * When sending from DFC -> EVM, check that EVM wallet has enough balance;
   */
  const isSendingFromEvm = selectedNetworkA.name === Network.Ethereum;

  useEffect(() => {
    async function checkBalance() {
      try {
        let balance;
        if (isSendingFromEvm) {
          balance = await balanceDfc({
            tokenSymbol: symbol,
          }).unwrap();
        } else {
          balance = await balanceEvm({
            tokenSymbol: symbol,
          }).unwrap();
        }

        setBalanceAmount(balance);
      } catch (e) {
        Logging.error(e);
      }
    }

    checkBalance();
  }, [selectedNetworkA, selectedTokensA, networkEnv]);

  return { balanceAmount };
}
