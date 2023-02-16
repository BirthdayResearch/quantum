import BigNumber from "bignumber.js";
import { FiArrowUpRight } from "react-icons/fi";
import ConfirmationProgress from "./TransactionConfirmationProgressBar";
import { useContractContext } from "../layouts/contexts/ContractContext";

export default function TransactionStatus({
  ethTxnStatus,
  txnHash,
}: {
  ethTxnStatus: {
    isConfirmed: boolean;
    numberOfConfirmations: string;
  };
  txnHash?: string;
}) {
  const { ExplorerURL } = useContractContext();
  const ConfirmationBlocksTotal = 65;

  return (
    <div className="w-full flex flex-col-reverse lg:flex-row lg:space-x-8 px-8 py-6 mb-6 text-dark-1000 dark-bg-gradient-1 rounded-xl border border-transparent">
      <div>
        <div className="font-bold leading-5 lg:text-xl lg:font-semibold">
          Processing transaction
        </div>
        <div className="pt-1 text-sm text-dark-700">
          Do not refresh, leave the browser, or close the tab until transaction
          is complete. Doing so may interrupt the transaction and cause loss of
          funds.
        </div>
        <a
          className="flex flex-row items-center mt-2 text-dark-900 text-xl font-bold hover:opacity-70"
          href={`${ExplorerURL}/tx/${txnHash}`}
          target="_blank"
          rel="noreferrer"
        >
          <FiArrowUpRight size={20} className="mr-2" />
          View on Etherscan
        </a>
      </div>
      <div className="mb-4 md:mb-0">
        <ConfirmationProgress
          confirmationBlocksTotal={ConfirmationBlocksTotal}
          confirmationBlocksCurrent={
            new BigNumber(ethTxnStatus.numberOfConfirmations).isGreaterThan(65)
              ? ConfirmationBlocksTotal.toString()
              : ethTxnStatus.numberOfConfirmations
          }
        />
      </div>
    </div>
  );
}
