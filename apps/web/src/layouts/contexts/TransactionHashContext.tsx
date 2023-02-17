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

type TransactionHashType = "confirmed" | "unconfirmed";
interface TransactionHashI {
  txnHash: {
    confirmed?: string;
    unconfirmed?: string;
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
  const { networkEnv } = useNetworkEnvironmentContext();

  const { UNCONFIRMED_TXN_HASH_KEY, CONFIRMED_TXN_HASH_KEY } =
    useBridgeFormStorageKeys();

  useEffect(() => {
    const unconfirmedTxnHashKeyStorage =
      getStorageItem<string>(UNCONFIRMED_TXN_HASH_KEY) ?? undefined;
    const confirmedTxnHashKeyStorage =
      getStorageItem<string>(CONFIRMED_TXN_HASH_KEY) ?? undefined;

    setUnconfirmedTxnHashKey(unconfirmedTxnHashKeyStorage);
    setConfirmedTxnHashKey(confirmedTxnHashKeyStorage);
  }, [networkEnv]);

  const context: TransactionHashI = useMemo(() => {
    const setTxnHash = (key: TransactionHashType, newTxnHash: string) => {
      if (key === "confirmed") {
        setConfirmedTxnHashKey(newTxnHash);
        setStorageItem(CONFIRMED_TXN_HASH_KEY, newTxnHash);
      } else {
        setUnconfirmedTxnHashKey(newTxnHash);
        setStorageItem(UNCONFIRMED_TXN_HASH_KEY, newTxnHash);
      }
    };

    const getTxnHash = (key: TransactionHashType) =>
      key === "confirmed" ? confirmedTxnHashKey : unconfirmedTxnHashKey;

    return {
      txnHash: {
        confirmed:
          confirmedTxnHashKey === null ? undefined : confirmedTxnHashKey,
        unconfirmed:
          unconfirmedTxnHashKey === null ? undefined : unconfirmedTxnHashKey,
      },
      getTxnHash,
      setTxnHash,
    };
  }, [
    unconfirmedTxnHashKey,
    confirmedTxnHashKey,
    CONFIRMED_TXN_HASH_KEY,
    UNCONFIRMED_TXN_HASH_KEY,
  ]);

  return (
    <TransactionHashContext.Provider value={context}>
      {children}
    </TransactionHashContext.Provider>
  );
}
