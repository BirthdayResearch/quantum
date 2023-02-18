import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import {
  STORAGE_TXN_KEY,
  STORAGE_DFC_ADDR_KEY,
  STORAGE_UNCONFIRMED_TXN_HASH_KEY,
  STORAGE_CONFIRMED_TXN_HASH_KEY,
  STORAGE_REVERTED_TXN_HASH_KEY,
} from "../constants";

export default function useBridgeFormStorageKeys() {
  const { networkEnv } = useNetworkEnvironmentContext();

  // Local storage txn key grouped by network
  const UNCONFIRMED_TXN_HASH_KEY = `${networkEnv}.${STORAGE_UNCONFIRMED_TXN_HASH_KEY}`;
  const CONFIRMED_TXN_HASH_KEY = `${networkEnv}.${STORAGE_CONFIRMED_TXN_HASH_KEY}`;
  const REVERTED_TXN_HASH_KEY = `${networkEnv}.${STORAGE_REVERTED_TXN_HASH_KEY}`;
  const TXN_KEY = `${networkEnv}.${STORAGE_TXN_KEY}`;
  const DFC_ADDR_KEY = `${networkEnv}.${STORAGE_DFC_ADDR_KEY}`;
  return {
    UNCONFIRMED_TXN_HASH_KEY,
    CONFIRMED_TXN_HASH_KEY,
    REVERTED_TXN_HASH_KEY,
    TXN_KEY,
    DFC_ADDR_KEY,
  };
}
