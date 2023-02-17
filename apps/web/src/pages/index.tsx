import BridgeForm from "@components/BridgeForm";
import WelcomeHeader from "@components/WelcomeHeader";
// import MobileBottomMenu from "@components/MobileBottomMenu";
import useWatchEthTxn from "@hooks/useWatchEthTxn";
import TransactionStatus from "@components/TransactionStatus";
import { useTransactionHashContext } from "@contexts/TransactionHashContext";
import { CONFIRMATIONS_BLOCK_TOTAL } from "../constants";

function Home() {
  const { ethTxnStatus, isApiSuccess } = useWatchEthTxn();
  const { txnHash, setTxnHash } = useTransactionHashContext();

  return (
    <section
      className="relative mt-8 flex min-h-screen flex-col md:mt-7 lg:mt-12"
      data-testid="homepage"
    >
      <div className="flex flex-col md:flex-row w-full px-0 md:px-12 lg:px-[120px]">
        <div className="flex flex-col justify-between px-6 pb-7 md:px-0 md:pb-0 md:w-5/12 md:mr-8 lg:mr-[72px]">
          <WelcomeHeader />
        </div>
        <div className="flex-1">
          {(txnHash.unconfirmed || txnHash.confirmed) && (
            <TransactionStatus
              onClose={() => setTxnHash("confirmed", null)}
              txnHash={txnHash.confirmed ?? txnHash.unconfirmed}
              isConfirmed={
                txnHash.confirmed !== undefined || ethTxnStatus.isConfirmed
              }
              numberOfConfirmations={
                txnHash.confirmed !== undefined
                  ? CONFIRMATIONS_BLOCK_TOTAL.toString()
                  : ethTxnStatus?.numberOfConfirmations
              }
              isApiSuccess={isApiSuccess}
            />
          )}
          <BridgeForm hasPendingTxn={txnHash.unconfirmed !== undefined} />
        </div>
      </div>
      {/* <div className="md:hidden mt-6 mb-12 mx-6"> TODO:: Hide Temporary
        <MobileBottomMenu />
      </div> */}
    </section>
  );
}

export default Home;
