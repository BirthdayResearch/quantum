import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import { useQueueStorageContext } from "@contexts/QueueStorageContext";
import {
  //   useAllocateDfcFundMutation,
  useCreateEthQueueTxnMutation,
  useVerifyEthQueueTxnMutation,
} from "@store/index";
import { HttpStatusCode } from "axios";
import { useEffect, useState } from "react";

/**
 * This polls in the /handle-transaction to verify if txn is confirmed (>= 65 confirmations)
 */
export default function useWatchEthQueueTxn() {
  const { networkEnv } = useNetworkEnvironmentContext();
  const { txnHash, setStorage } = useQueueStorageContext();
  console.log(txnHash);

  const [createEthQueueTxn] = useCreateEthQueueTxnMutation();
  const [verifyEthQueueTxn] = useCreateEthQueueTxnMutation();

  const [isQueueApiSuccess, setIsQueueApiSuccess] = useState(false);
  const [ethQueueTxnStatus, setEthQueueTxnStatus] = useState<{
    isConfirmed: boolean;
    numberOfConfirmations: string;
  }>({ isConfirmed: false, numberOfConfirmations: "0" });

  let pollInterval;

  /* Poll to check if the txn is already confirmed */
  useEffect(() => {
    setIsQueueApiSuccess(false);
    const pollConfirmEthTxn = async function poll(unconfirmed?: string) {
      try {
        if (unconfirmed === undefined) {
          return;
        }

        const ethQueueTxn = await createEthQueueTxn({
          txnHash: unconfirmed,
        }).unwrap();

        console.log(ethQueueTxn);

        if (!ethQueueTxn) {
          return;
        }

        const confirmEthTxnData = await verifyEthQueueTxn({
          txnHash: unconfirmed,
        }).unwrap();

        console.log(confirmEthTxnData);

        setEthQueueTxnStatus({
          isConfirmed: confirmEthTxnData?.isConfirmed,
          numberOfConfirmations: confirmEthTxnData?.numberOfConfirmations,
        });
        console.log(ethQueueTxnStatus);

        if (confirmEthTxnData?.isConfirmed) {
          setIsQueueApiSuccess(true);
        }

        setIsQueueApiSuccess(true);
      } catch ({ data }) {
        if (data?.error?.includes("Fund already allocated")) {
          setStorage("confirmed-queue", unconfirmed ?? null);
          setStorage("unconfirmed-queue", null);
          setStorage("txn-form-queue", null);
        } else if (
          data?.error?.includes("There is a problem in allocating fund")
        ) {
          setStorage("unsent-fund-queue", unconfirmed ?? null);
          setStorage("unconfirmed-queue", null);
        } else if (
          data?.statusCode === HttpStatusCode.BadRequest &&
          data?.message === "Transaction Reverted"
        ) {
          setStorage("reverted-queue", unconfirmed ?? null);
          setStorage("unconfirmed-queue", null);
        } else if (data?.statusCode === HttpStatusCode.TooManyRequests) {
          //   handle throttle error;
        }
      }
    };

    if (pollInterval !== undefined) {
      clearInterval(pollInterval);
    }

    // Run on load
    if (!isQueueApiSuccess) {
      setEthQueueTxnStatus({
        isConfirmed: false,
        numberOfConfirmations: "0",
      });

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

  return { ethQueueTxnStatus, isQueueApiSuccess };
}