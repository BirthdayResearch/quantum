import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import { useEffect, useState } from "react";
import {
  DFC_CONFIRMATIONS_BLOCK_TOTAL,
  ETHEREUM_MAINNET_ID,
} from "../constants";
import Logging from "../api/logging";
import { WhaleApiClient } from "@defichain/whale-api-client";
import { useNetwork } from "wagmi";

export default function useWatchDfcTxn(txnId?: string) {
  const { networkEnv } = useNetworkEnvironmentContext();
  const { chain } = useNetwork();
  const isEthereumMainNet = chain?.id === ETHEREUM_MAINNET_ID;
  const client = new WhaleApiClient({
    url: isEthereumMainNet
      ? "https://ocean.defichain.com"
      : "https://testnet.ocean.jellyfishsdk.com",
    network: isEthereumMainNet ? "mainnet" : "testnet",
    version: "v0",
  });

  const [shouldStopPolling, setStopPolling] = useState(false);
  const [isApiSuccess, setIsApiSuccess] = useState(false);
  const [dfcTxnStatus, setDfcTxnStatus] = useState<{
    isConfirmed: boolean;
    numberOfConfirmations: string;
  }>({
    isConfirmed: false,
    numberOfConfirmations: "0",
  });

  let pollInterval;

  function clearPollInterval() {
    if (pollInterval !== undefined) {
      clearInterval(pollInterval);
    }
  }

  /* Poll to check if the txn is already confirmed */
  useEffect(() => {
    setIsApiSuccess(false);
    const pollConfirmEthTxn = async function poll(
      transactionId?: string,
      stopPolling?: boolean
    ) {
      try {
        console.log(`transactionId: ${transactionId}`);
        console.log(`stopPolling: ${stopPolling}`);
        if (
          transactionId === undefined ||
          stopPolling === undefined ||
          stopPolling
        ) {
          return;
        }
        const stats = await client.stats.get();
        console.log(`stats: ${JSON.stringify(stats)}`);
        const txnData = await client.transactions.get(transactionId);
        const numberOfConfirmations = stats.count.blocks - txnData.block.height;
        let isConfirmed = false;
        if (numberOfConfirmations >= DFC_CONFIRMATIONS_BLOCK_TOTAL) {
          isConfirmed = true;
        }
        setDfcTxnStatus({
          isConfirmed,
          numberOfConfirmations: numberOfConfirmations.toString(),
        });
        setIsApiSuccess(true);
        setStopPolling(isConfirmed);
      } catch (e) {
        Logging.error(e);
        setDfcTxnStatus({ isConfirmed: false, numberOfConfirmations: "0" });
      }
    };

    clearPollInterval();

    if (!shouldStopPolling) {
      // Run on load
      if (!isApiSuccess) {
        console.log("polling on load");
        setDfcTxnStatus({
          isConfirmed: false,
          numberOfConfirmations: "0",
        });
        pollConfirmEthTxn(txnId, shouldStopPolling);
      }

      pollInterval = setInterval(() => {
        pollConfirmEthTxn(txnId, shouldStopPolling);
      }, 20000);
    }

    return () => {
      clearPollInterval();
    };
  }, [networkEnv, txnId, shouldStopPolling]);

  return { dfcTxnStatus, isApiSuccess };
}
