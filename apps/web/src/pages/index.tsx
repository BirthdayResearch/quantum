import { useEffect } from "react";
import BridgeForm from "@components/BridgeForm";
import WelcomeHeader from "@components/WelcomeHeader";
import MobileBottomMenu from "@components/MobileBottomMenu";
import useWatchEthTxn from "@hooks/useWatchEthTxn";
import TransactionStatus from "@components/TransactionStatus";
import { useStorageContext } from "@contexts/StorageContext";
import { CONFIRMATIONS_BLOCK_TOTAL } from "../constants";
import useBridgeFormStorageKeys from "../hooks/useBridgeFormStorageKeys";
import { getStorageItem } from "../utils/localStorage";

function Home() {
  const { ethTxnStatus, isApiSuccess } = useWatchEthTxn();
  const { txnHash, setStorage } = useStorageContext();
  const { UNCONFIRMED_TXN_HASH_KEY, UNSENT_FUND_TXN_HASH_KEY } =
    useBridgeFormStorageKeys();

  useEffect(() => {
    const unloadCallback = (e) => {
      const event = e;
      const unconfirmedHash = getStorageItem<string>(UNCONFIRMED_TXN_HASH_KEY);
      const unsentFundHash = getStorageItem<string>(UNSENT_FUND_TXN_HASH_KEY);
      if (unconfirmedHash !== undefined || unsentFundHash !== undefined) {
        // display native reload warning modal if there is unconfirmed txn ongoing
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
      return false;
    };
    window.addEventListener("beforeunload", unloadCallback);
    return () => window.removeEventListener("beforeunload", unloadCallback);
  }, [UNCONFIRMED_TXN_HASH_KEY, UNSENT_FUND_TXN_HASH_KEY]);

  const getNumberOfConfirmations = () => {
    let numOfConfirmations = ethTxnStatus?.numberOfConfirmations;

    if (txnHash.confirmed !== undefined || txnHash.unsentFund !== undefined) {
      numOfConfirmations = CONFIRMATIONS_BLOCK_TOTAL.toString();
    } else if (txnHash.reverted !== undefined) {
      numOfConfirmations = "0";
    }

    return numOfConfirmations;
  };

  return (
    <section className="relative flex flex-col" data-testid="homepage">
      <div className="flex flex-col justify-between md:flex-row w-full px-0 md:px-12 lg:px-[120px]">
        <div className="flex flex-col justify-between px-6 pb-7 md:px-0 md:pb-0 md:w-5/12 mt-6 mb-5 md:mb-0 lg:mt-12">
          <WelcomeHeader />
        </div>
        <div className="flex-1 md:max-w-[50%]">
          {(txnHash.unconfirmed ||
            txnHash.confirmed ||
            txnHash.reverted ||
            txnHash.unsentFund) && (
            <TransactionStatus
              onClose={() => {
                setStorage("confirmed", null);
                setStorage("allocationTxnHash", null);
                setStorage("reverted", null);
              }}
              txnHash={
                txnHash.unsentFund ??
                txnHash.reverted ??
                txnHash.confirmed ??
                txnHash.unconfirmed
              }
              allocationTxnHash={txnHash.allocationTxn}
              isReverted={txnHash.reverted !== undefined}
              isConfirmed={txnHash.confirmed !== undefined}
              isUnsentFund={txnHash.unsentFund !== undefined}
              numberOfConfirmations={getNumberOfConfirmations()}
              isApiSuccess={isApiSuccess || txnHash.reverted !== undefined}
            />
          )}
          <BridgeForm
            hasPendingTxn={
              txnHash.unconfirmed !== undefined ||
              txnHash.unsentFund !== undefined
            }
          />
        </div>
      </div>
      <div className="md:hidden mt-6 mb-12 mx-6">
        <MobileBottomMenu />
      </div>
    </section>
  );
}

export default Home;
