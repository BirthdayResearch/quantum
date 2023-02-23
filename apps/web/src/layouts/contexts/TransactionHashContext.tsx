import useBridgeFormStorageKeys from "@hooks/useBridgeFormStorageKeys";
import { getStorageItem, setStorageItem } from "@utils/localStorage";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  PropsWithChildren,
} from "react";
import { useNetworkEnvironmentContext } from "./NetworkEnvironmentContext";

type TransactionHashType =
  | "confirmed"
  | "unconfirmed"
  | "reverted"
  | "unsent-fund";
interface TransactionHashI {
  txnHash: {
    confirmed?: string;
    unconfirmed?: string;
    reverted?: string;
    unsentFund?: string;
  };
  getTxnHash: (key: TransactionHashType) => string | undefined;
  setTxnHash: (key: TransactionHashType, txnHash: string | null) => void;
}

export interface PoolpairId {
  id: string;
}

const TransactionHashContext = createContext<TransactionHashI>(
  undefined as any
);

export function useTransactionHashContext(): TransactionHashI {
  return useContext(TransactionHashContext);
}

export function TransactionHashProvider({
  children,
}: PropsWithChildren<any>): JSX.Element | null {
  const [unconfirmedTxnHashKey, setUnconfirmedTxnHashKey] = useState<string>();
  const [confirmedTxnHashKey, setConfirmedTxnHashKey] = useState<string>();
  const [revertedTxnHashKey, setRevertedTxnHashKey] = useState<string>();
  const [unsentFundTxnHashKey, setUnsentFundTxnHashKey] = useState<string>();

  const { networkEnv } = useNetworkEnvironmentContext();

  const {
    UNCONFIRMED_TXN_HASH_KEY,
    CONFIRMED_TXN_HASH_KEY,
    REVERTED_TXN_HASH_KEY,
    UNSENT_FUND_TXN_HASH_KEY,
  } = useBridgeFormStorageKeys();

  useEffect(() => {
    const unconfirmedTxnHashKeyStorage =
      getStorageItem<string>(UNCONFIRMED_TXN_HASH_KEY) ?? undefined;
    const confirmedTxnHashKeyStorage =
      getStorageItem<string>(CONFIRMED_TXN_HASH_KEY) ?? undefined;
    const revertedTxnHashKeyStorage =
      getStorageItem<string>(REVERTED_TXN_HASH_KEY) ?? undefined;
    const unsentFundTxnHashKeyStorage =
      getStorageItem<string>(UNSENT_FUND_TXN_HASH_KEY) ?? undefined;

    setUnconfirmedTxnHashKey(unconfirmedTxnHashKeyStorage);
    setConfirmedTxnHashKey(confirmedTxnHashKeyStorage);
    setRevertedTxnHashKey(revertedTxnHashKeyStorage);
    setUnsentFundTxnHashKey(unsentFundTxnHashKeyStorage);
  }, [
    networkEnv,
    CONFIRMED_TXN_HASH_KEY,
    UNCONFIRMED_TXN_HASH_KEY,
    REVERTED_TXN_HASH_KEY,
    UNSENT_FUND_TXN_HASH_KEY,
  ]);

  const context: TransactionHashI = useMemo(() => {
    const setTxnHash = (key: TransactionHashType, newTxnHash: string) => {
      if (key === "confirmed") {
        setConfirmedTxnHashKey(newTxnHash);
        setStorageItem(CONFIRMED_TXN_HASH_KEY, newTxnHash);
      } else if (key === "reverted") {
        setRevertedTxnHashKey(newTxnHash);
        setStorageItem(REVERTED_TXN_HASH_KEY, newTxnHash);
      } else if (key === "unsent-fund") {
        setUnsentFundTxnHashKey(newTxnHash);
        setStorageItem(UNSENT_FUND_TXN_HASH_KEY, newTxnHash);
      } else {
        setUnconfirmedTxnHashKey(newTxnHash);
        setStorageItem(UNCONFIRMED_TXN_HASH_KEY, newTxnHash);
      }
    };

    const getTxnHash = (key: TransactionHashType) => {
      let txnHash;

      if (key === "confirmed") {
        txnHash = confirmedTxnHashKey;
      } else if (key === "unconfirmed") {
        txnHash = unconfirmedTxnHashKey;
      } else if (key === "unsent-fund") {
        txnHash = unsentFundTxnHashKey;
      } else if (key === "reverted") {
        txnHash = revertedTxnHashKey;
      }

      return txnHash;
    };

    return {
      txnHash: {
        confirmed:
          confirmedTxnHashKey === null ? undefined : confirmedTxnHashKey,
        unconfirmed:
          unconfirmedTxnHashKey === null ? undefined : unconfirmedTxnHashKey,
        reverted: revertedTxnHashKey === null ? undefined : revertedTxnHashKey,
        unsentFund:
          unsentFundTxnHashKey === null ? undefined : unsentFundTxnHashKey,
      },
      getTxnHash,
      setTxnHash,
    };
  }, [
    unconfirmedTxnHashKey,
    confirmedTxnHashKey,
    revertedTxnHashKey,
    unsentFundTxnHashKey,
    REVERTED_TXN_HASH_KEY,
    CONFIRMED_TXN_HASH_KEY,
    UNCONFIRMED_TXN_HASH_KEY,
    UNSENT_FUND_TXN_HASH_KEY,
  ]);

  return (
    <TransactionHashContext.Provider value={context}>
      {children}
    </TransactionHashContext.Provider>
  );
}
