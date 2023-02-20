import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import { useTransactionHashContext } from "@contexts/TransactionHashContext";
import { useConfirmEthTxnMutation } from "@store/index";
import { HttpStatusCode } from "axios";
import { useEffect, useState } from "react";

/**
 * This polls in the /handle-transaction to verify if txn is confirmed (>= 65 confirmations)
 */
export default function useWatchEthTxn() {
  const { networkEnv } = useNetworkEnvironmentContext();
  const { txnHash, setTxnHash } = useTransactionHashContext();

  const [confirmEthTxn] = useConfirmEthTxnMutation();

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
            setTxnHash("confirmed", unconfirmed ?? null);
            setTxnHash("unconfirmed", null);
          }

          setEthTxnStatus({
            isConfirmed: data?.isConfirmed,
            numberOfConfirmations: data?.numberOfConfirmations,
          });
          setIsApiSuccess(true);
        }
      } catch ({ data }) {
        if (
          data?.statusCode === HttpStatusCode.BadRequest &&
          data?.message === "Transaction Reverted"
        ) {
          setTxnHash("reverted", unconfirmed ?? null);
          setTxnHash("unconfirmed", null);
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
