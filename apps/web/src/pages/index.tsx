import { useEffect, useState } from "react";
import BigNumber from "bignumber.js";
import BridgeForm from "@components/BridgeForm";
import WelcomeHeader from "@components/WelcomeHeader";
import MobileBottomMenu from "@components/MobileBottomMenu";
import useWatchEthTxn from "@hooks/useWatchEthTxn";
import { useStorageContext } from "@contexts/StorageContext";
import { FormOptions } from "@contexts/NetworkContext";
import Logging from "@api/logging";
import { getStorageItem } from "@utils/localStorage";
import { DEFICHAIN_WALLET_URL } from "config/networkUrl";
import {
  CONFIRMATIONS_BLOCK_TOTAL,
  EVM_CONFIRMATIONS_BLOCK_TOTAL,
} from "../constants";
import useBridgeFormStorageKeys from "../hooks/useBridgeFormStorageKeys";
import QueueForm from "../components/QueueForm";
import FormTab from "../components/FormTab";
import { useQueueStorageContext } from "../layouts/contexts/QueueStorageContext";

function Home() {
  const { ethTxnStatus, dfcTxnStatus, isApiSuccess } = useWatchEthTxn();
  const { txnHash, setStorage } = useStorageContext();
  // Todo: update to useQueueStorageContext to get the storage for queue
  const { txnHash: txnHashQueue } = useQueueStorageContext();
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
    let numOfConfirmations = BigNumber.min(
      ethTxnStatus?.numberOfConfirmations,
      EVM_CONFIRMATIONS_BLOCK_TOTAL
    ).toString();

    if (txnHash.confirmed !== undefined || txnHash.unsentFund !== undefined) {
      numOfConfirmations = CONFIRMATIONS_BLOCK_TOTAL.toString();
    } else if (txnHash.reverted !== undefined) {
      numOfConfirmations = "0";
    }

    return numOfConfirmations;
  };

  const [activeTab, setActiveTab] = useState(FormOptions.INSTANT);

  return (
    <section className="relative flex flex-col" data-testid="homepage">
      <div className="flex flex-col justify-between md:flex-row w-full px-0 md:px-12 lg:px-[120px]">
        <div className="flex flex-col justify-between px-6 pb-7 md:px-0 md:pb-0 md:w-5/12 mt-6 mb-5 md:mb-0 lg:mt-12">
          <WelcomeHeader />
        </div>
        <div className="flex-1 md:max-w-[50%] lg:min-w-[562px]">
          <FormTab activeTab={activeTab} setActiveTab={setActiveTab} />
          {/*
          // Todo : add condition for active tab to switch between <BridgeForm/> and <QueueForm/>
          */}
          <BridgeForm
            activeTab={activeTab}
            hasPendingTxn={
              txnHash.unconfirmed !== undefined ||
              txnHash.unsentFund !== undefined
            }
          />
          <QueueForm
            activeTab={activeTab}
            hasPendingTxn={
              txnHashQueue.unconfirmed !== undefined ||
              txnHashQueue.unsentFund !== undefined
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

export async function getServerSideProps() {
  const props = { isBridgeUp: true };

  try {
    const res = await fetch(`${DEFICHAIN_WALLET_URL}/bridge/status`);
    const data = await res.json();
    if (res.status === 200) {
      props.isBridgeUp = data?.isUp;
    } else {
      Logging.error("Get bridge status API error.");
    }
  } catch (e) {
    Logging.error(`${e}`);
  }

  return { props };
}

export default Home;
