import BigNumber from "bignumber.js";
import { FiArrowUpRight } from "react-icons/fi";
import { IoHelpCircle } from "react-icons/io5";
import useResponsive from "../hooks/useResponsive";
import { useContractContext } from "../layouts/contexts/ContractContext";
import { useEffect, useState } from "react";
import clsx from "clsx";

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
  const { isLg, isMd } = useResponsive();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (ethTxnStatus.isConfirmed) {
      setTitle("Transaction confirmed");
      setDescription("Expect to receive your tokens in your wallet shortly.");
    } else {
      setTitle("Processing transaction");
      setDescription(
        "Do not refresh, leave the browser, or close the tab until transaction is complete. Doing so may interrupt the transaction and cause loss of funds."
      );
    }
  }, [ethTxnStatus.isConfirmed]);

  return (
    <div
      className={clsx(
        "flex-1 px-8 py-6 text-dark-1000 rounded-xl border bg-dark-100 ",
        ethTxnStatus.isConfirmed
          ? "border-dark-card-stroke"
          : "dark-bg-gradient-1 border-transparent",
        isMd ? "mb-6" : "m-6"
      )}
    >
      <div className="leading-5 lg:text-xl lg:font-semibold">{title}</div>
      <div className="pt-1 text-sm text-dark-700">{description}</div>
      <div className="flex flex-row items-center mt-2 text-dark-900 text-xl font-bold ">
        <a
          className="flex flex-row items-center hover:opacity-70"
          href={`${ExplorerURL}/tx/${txnHash}`}
          target="_blank"
        >
          <FiArrowUpRight size={20} className="mr-2" />
          View on Etherscan
        </a>
        {ethTxnStatus.isConfirmed && (
          <a className="flex flex-row items-center hover:opacity-70 ml-5">
            <IoHelpCircle size={20} className="mr-2" />
            Help
          </a>
        )}
      </div>
      <div>{`${
        new BigNumber(ethTxnStatus.numberOfConfirmations).isGreaterThan(65)
          ? "65"
          : ethTxnStatus.numberOfConfirmations
      } of 65 Confirmations`}</div>
    </div>
  );
}

function ProgressCircle(): JSX.Element {
  return <div></div>;
}

function ProgressBar(): JSX.Element {
  return (
    <div className="flex text-sm text-dark-700">
      <span className="font-semibold text-brand-100">0 of 65&nbsp;</span>
      confirmations
    </div>
  );
}
