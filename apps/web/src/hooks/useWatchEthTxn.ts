import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import { useTransactionHashContext } from "@contexts/TransactionHashContext";
import { useConfirmEthTxnMutation } from "@store/website";
import { HttpStatusCode } from "axios";
import { useEffect, useState } from "react";

/**
 * This polls in the /handle-transaction to verify if txn is confirmed (>= 65 confirmations)
 */
export default function useWatchEthTxn() {
  const { networkEnv } = useNetworkEnvironmentContext();
  const { txnHash, setTxnHash } = useTransactionHashContext();

  const [confirmEthTxn] = useConfirmEthTxnMutation();

  const [isApiLoading, setIsApiLoading] = useState(true);
  const [ethTxnStatus, setEthTxnStatus] = useState<{
    isConfirmed: boolean;
    numberOfConfirmations: string;
  }>({ isConfirmed: false, numberOfConfirmations: "0" });

  /* Poll to check if the txn is already confirmed */
  useEffect(() => {
    const pollConfirmEthTxn = async function poll() {
      try {
        if (txnHash.unconfirmed === undefined) {
          return;
        }

        const data = await confirmEthTxn({
          txnHash: txnHash.unconfirmed,
        }).unwrap();

        if (data) {
          if (data?.isConfirmed) {
            setTxnHash("confirmed", txnHash.unconfirmed ?? null);
            setTxnHash("unconfirmed", null);
          }

          setEthTxnStatus({
            isConfirmed: data?.isConfirmed,
            numberOfConfirmations: data?.numberOfConfirmations,
          });
          setIsApiLoading(false);
        }
      } catch ({ data }) {
        if (data?.statusCode === HttpStatusCode.TooManyRequests) {
          //   handle throttle error;
        }
        setIsApiLoading(false);
      }
      setTimeout(pollConfirmEthTxn, 20000);
    };
    pollConfirmEthTxn();
  }, [networkEnv, txnHash]);

  return { ethTxnStatus, isApiLoading };
}
