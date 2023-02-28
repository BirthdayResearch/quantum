import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import { useStorageContext } from "@contexts/StorageContext";
import {
  useAllocateDfcFundMutation,
  useConfirmEthTxnMutation,
} from "@store/index";
import { HttpStatusCode } from "axios";
import { useEffect, useState } from "react";

/**
 * This polls in the /handle-transaction to verify if txn is confirmed (>= 65 confirmations)
 */
export default function useWatchEthTxn() {
  const { networkEnv } = useNetworkEnvironmentContext();
  const { txnHash, setStorage } = useStorageContext();

  const [confirmEthTxn] = useConfirmEthTxnMutation();
  const [allocateDfcFund] = useAllocateDfcFundMutation();

  const [isApiSuccess, setIsApiSuccess] = useState(false);
  const [ethTxnStatus, setEthTxnStatus] = useState<{
    isConfirmed: boolean;
    numberOfConfirmations: string;
  }>({ isConfirmed: false, numberOfConfirmations: "0" });
  let pollInterval;

  /* Poll to check if the txn is already confirmed */
  useEffect(() => {
    setIsApiSuccess(false);
    const pollConfirmEthTxn = async function poll(unconfirmed?: string) {
      try {
        if (unconfirmed === undefined) {
          return;
        }

        const data = await confirmEthTxn({
          txnHash: unconfirmed,
        }).unwrap();

        if (data) {
          if (data?.isConfirmed) {
            const fundData = await allocateDfcFund({
              txnHash: unconfirmed,
            }).unwrap();

            if (fundData?.transactionHash !== undefined) {
              setStorage("allocationTxnHash", fundData?.transactionHash);
              setStorage("confirmed", unconfirmed ?? null);
              setStorage("unconfirmed", null);
            }
          }

          setEthTxnStatus({
            isConfirmed: data?.isConfirmed,
            numberOfConfirmations: data?.numberOfConfirmations,
          });
          setIsApiSuccess(true);
        }
      } catch ({ data }) {
        if (data?.error?.includes("Fund already allocated")) {
          setStorage("confirmed", unconfirmed ?? null);
          setStorage("unconfirmed", null);
        } else if (
          data?.error?.includes("There is a problem in allocating fund")
        ) {
          setStorage("unsent-fund", unconfirmed ?? null);
          setStorage("unconfirmed", null);
        } else if (
          data?.statusCode === HttpStatusCode.BadRequest &&
          data?.message === "Transaction Reverted"
        ) {
          setStorage("reverted", unconfirmed ?? null);
          setStorage("unconfirmed", null);
        } else if (data?.statusCode === HttpStatusCode.TooManyRequests) {
          //   handle throttle error;
        }
      }
    };

    if (pollInterval !== undefined) {
      clearInterval(pollInterval);
    }

    // Run on load
    if (!isApiSuccess) {
      pollConfirmEthTxn(txnHash.unconfirmed);
    }

    pollInterval = setInterval(() => {
      pollConfirmEthTxn(txnHash.unconfirmed);
    }, 20000);

    return () => {
      if (pollInterval !== undefined) {
        clearInterval(pollInterval);
      }
    };
  }, [networkEnv, txnHash]);

  return { ethTxnStatus, isApiSuccess };
}
