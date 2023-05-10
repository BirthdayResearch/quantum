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
import { AddressDetails, UnconfirmedQueueTxnI } from "types";
import { useNetworkEnvironmentContext } from "./NetworkEnvironmentContext";

type StorageKey =
  | "confirmed-queue"
  | "allocationTxnHash-queue"
  | "unconfirmed-queue"
  | "reverted-queue"
  | "unsent-fund-queue"
  | "dfc-address-queue"
  | "dfc-address-details-queue"
  | "txn-form-queue";

interface StorageContextQueueI {
  txnHash: {
    confirmed?: string;
    unconfirmed?: string;
    reverted?: string;
    unsentFund?: string;
    allocationTxn?: string;
  };
  dfcAddress?: string;
  dfcAddressDetails?: AddressDetails;
  txnForm?: UnconfirmedQueueTxnI;
  getStorage: (key: StorageKey) => string | undefined;
  setStorage: (key: StorageKey, value: string | null) => void;
}

/*
  - To serve as a global state that syncs with the local storage
*/
const StorageContextQueue = createContext<StorageContextQueueI>(
  undefined as any
);

export function useQueueStorageContext(): StorageContextQueueI {
  return useContext(StorageContextQueue);
}

export function QueueStorageProvider({
  children,
}: PropsWithChildren<any>): JSX.Element | null {
  const [unconfirmedQueueTxnHashKey, setUnconfirmedQueueTxnHashKey] =
    useState<string>();
  const [confirmedQueueTxnHashKey, setConfirmedQueueTxnHashKey] =
    useState<string>();
  const [allocationQueueTxnHashKey, setAllocationQueueTxnHashKey] =
    useState<string>();
  const [revertedQueueTxnHashKey, setRevertedQueueTxnHashKey] =
    useState<string>();
  const [unsentQueueFundTxnHashKey, setUnsentQueueFundTxnHashKey] =
    useState<string>();
  const [dfcQueueAddress, setDfcQueueAddress] = useState<string>();
  const [dfcQueueAddressDetails, setDfcQueueAddressDetails] =
    useState<AddressDetails>();
  const [queueTxnForm, setQueueTxnForm] = useState<any>();

  const { networkEnv } = useNetworkEnvironmentContext();

  const {
    UNCONFIRMED_QUEUE_TXN_HASH_KEY,
    CONFIRMED_QUEUE_TXN_HASH_KEY,
    REVERTED_QUEUE_TXN_HASH_KEY,
    UNSENT_QUEUE_FUND_TXN_HASH_KEY,
    QUEUE_TXN_KEY,
    QUEUE_DFC_ADDR_KEY,
    QUEUE_DFC_ADDR_DETAILS_KEY,
    QUEUE_ALLOCATION_TXN_HASH_KEY,
  } = useBridgeFormStorageKeys();

  useEffect(() => {
    // Both ways
    const txnFormStorage =
      getStorageItem<UnconfirmedQueueTxnI>(QUEUE_TXN_KEY) ?? undefined;
    setQueueTxnForm(txnFormStorage);

    // DFC -> EVM
    const dfcAddressStorage =
      getStorageItem<string>(QUEUE_DFC_ADDR_KEY) ?? undefined;
    const dfcAddressDetailsStorage =
      getStorageItem<AddressDetails>(QUEUE_DFC_ADDR_DETAILS_KEY) ?? undefined;

    setDfcQueueAddress(dfcAddressStorage);
    setDfcQueueAddressDetails(dfcAddressDetailsStorage);

    // EVM -> DFC
    const unconfirmedTxnHashKeyStorage =
      getStorageItem<string>(UNCONFIRMED_QUEUE_TXN_HASH_KEY) ?? undefined;
    const confirmedTxnHashKeyStorage =
      getStorageItem<string>(CONFIRMED_QUEUE_TXN_HASH_KEY) ?? undefined;
    const allocationTxnHashKeyStorage =
      getStorageItem<string>(QUEUE_ALLOCATION_TXN_HASH_KEY) ?? undefined;
    const revertedTxnHashKeyStorage =
      getStorageItem<string>(REVERTED_QUEUE_TXN_HASH_KEY) ?? undefined;
    const unsentFundTxnHashKeyStorage =
      getStorageItem<string>(UNSENT_QUEUE_FUND_TXN_HASH_KEY) ?? undefined;

    setUnconfirmedQueueTxnHashKey(unconfirmedTxnHashKeyStorage);
    setConfirmedQueueTxnHashKey(confirmedTxnHashKeyStorage);
    setAllocationQueueTxnHashKey(allocationTxnHashKeyStorage);
    setRevertedQueueTxnHashKey(revertedTxnHashKeyStorage);
    setUnsentQueueFundTxnHashKey(unsentFundTxnHashKeyStorage);
  }, [
    networkEnv,
    UNCONFIRMED_QUEUE_TXN_HASH_KEY,
    CONFIRMED_QUEUE_TXN_HASH_KEY,
    REVERTED_QUEUE_TXN_HASH_KEY,
    UNSENT_QUEUE_FUND_TXN_HASH_KEY,
    QUEUE_TXN_KEY,
    QUEUE_DFC_ADDR_KEY,
    QUEUE_DFC_ADDR_DETAILS_KEY,
    QUEUE_ALLOCATION_TXN_HASH_KEY,
  ]);

  const context: StorageContextQueueI = useMemo(() => {
    const setStorage = (key: StorageKey, value: string) => {
      switch (key) {
        case "confirmed-queue":
          setConfirmedQueueTxnHashKey(value);
          setStorageItem(CONFIRMED_QUEUE_TXN_HASH_KEY, value);
          break;
        case "reverted-queue":
          setRevertedQueueTxnHashKey(value);
          setStorageItem(REVERTED_QUEUE_TXN_HASH_KEY, value);
          break;
        case "unsent-fund-queue":
          setUnsentQueueFundTxnHashKey(value);
          setStorageItem(UNSENT_QUEUE_FUND_TXN_HASH_KEY, value);
          break;
        case "allocationTxnHash-queue":
          setStorageItem(QUEUE_ALLOCATION_TXN_HASH_KEY, value);
          break;
        case "dfc-address-queue":
          setDfcQueueAddress(value);
          setStorageItem(QUEUE_DFC_ADDR_KEY, value);
          break;
        case "unconfirmed-queue":
          setUnconfirmedQueueTxnHashKey(value);
          setStorageItem(UNCONFIRMED_QUEUE_TXN_HASH_KEY, value);
          break;
        case "dfc-address-details-queue":
          setDfcQueueAddressDetails(JSON.parse(value));
          setStorageItem(QUEUE_DFC_ADDR_DETAILS_KEY, JSON.parse(value));
          break;
        case "txn-form-queue":
          setQueueTxnForm(JSON.parse(value));
          setStorageItem(QUEUE_TXN_KEY, JSON.parse(value));
          break;
        default:
        // no action needed ( using switch as switch faster than if else )
      }
    };

    const getStorage = (key: StorageKey) => {
      let value;

      if (key === "confirmed-queue") {
        value = confirmedQueueTxnHashKey;
      } else if (key === "unconfirmed-queue") {
        value = unconfirmedQueueTxnHashKey;
      } else if (key === "allocationTxnHash-queue") {
        value = allocationQueueTxnHashKey;
      } else if (key === "unsent-fund-queue") {
        value = unsentQueueFundTxnHashKey;
      } else if (key === "reverted-queue") {
        value = revertedQueueTxnHashKey;
      } else if (key === "dfc-address-queue") {
        value = dfcQueueAddress;
      } else if (key === "dfc-address-details-queue") {
        value = dfcQueueAddressDetails;
      } else if (key === "txn-form-queue") {
        value = queueTxnForm;
      }

      return value;
    };
    return {
      txnHash: {
        confirmed:
          confirmedQueueTxnHashKey === null
            ? undefined
            : confirmedQueueTxnHashKey,
        unconfirmed:
          unconfirmedQueueTxnHashKey === null
            ? undefined
            : unconfirmedQueueTxnHashKey,
        reverted:
          revertedQueueTxnHashKey === null
            ? undefined
            : revertedQueueTxnHashKey,
        unsentFund:
          unsentQueueFundTxnHashKey === null
            ? undefined
            : unsentQueueFundTxnHashKey,
        allocationTxn:
          allocationQueueTxnHashKey === null
            ? undefined
            : allocationQueueTxnHashKey,
      },
      dfcAddress: dfcQueueAddress === null ? undefined : dfcQueueAddress,
      dfcAddressDetails:
        dfcQueueAddressDetails === null ? undefined : dfcQueueAddressDetails,
      txnForm: queueTxnForm === null ? undefined : queueTxnForm,
      getStorage,
      setStorage,
    };
  }, [
    unconfirmedQueueTxnHashKey,
    confirmedQueueTxnHashKey,
    allocationQueueTxnHashKey,
    revertedQueueTxnHashKey,
    unsentQueueFundTxnHashKey,
    dfcQueueAddress,
    dfcQueueAddressDetails,
    queueTxnForm,
    UNCONFIRMED_QUEUE_TXN_HASH_KEY,
    CONFIRMED_QUEUE_TXN_HASH_KEY,
    REVERTED_QUEUE_TXN_HASH_KEY,
    UNSENT_QUEUE_FUND_TXN_HASH_KEY,
    QUEUE_TXN_KEY,
    QUEUE_DFC_ADDR_KEY,
    QUEUE_DFC_ADDR_DETAILS_KEY,
    QUEUE_ALLOCATION_TXN_HASH_KEY,
  ]);

  return (
    <StorageContextQueue.Provider value={context}>
      {children}
    </StorageContextQueue.Provider>
  );
}
