import BigNumber from "bignumber.js";
import { FiArrowUpRight } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import clsx from "clsx";

import { useAllocateDfcFundMutation } from "@store/index";
import { useTransactionHashContext } from "@contexts/TransactionHashContext";
import { HttpStatusCode } from "axios";
import { CONFIRMATIONS_BLOCK_TOTAL } from "../constants";
import ConfirmationProgress from "./TransactionConfirmationProgressBar";
import useResponsive from "../hooks/useResponsive";
import { useContractContext } from "../layouts/contexts/ContractContext";
import ActionButton from "./commons/ActionButton";

export default function TransactionStatus({
  isConfirmed,
  isApiSuccess,
  isReverted,
  isUnsentFund,
  numberOfConfirmations,
  txnHash,
  onClose,
}: {
  isConfirmed: boolean;
  isApiSuccess: boolean;
  isReverted: boolean;
  isUnsentFund: boolean;
  numberOfConfirmations: string;
  txnHash: string | undefined;
  onClose: () => void;
}) {
  const { ExplorerURL } = useContractContext();
  const { isLg, isMd } = useResponsive();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const confirmationBlocksCurrent = BigNumber.min(
    CONFIRMATIONS_BLOCK_TOTAL,
    numberOfConfirmations
  ).toFixed();
  const [allocateDfcFund] = useAllocateDfcFundMutation();
  const { setTxnHash } = useTransactionHashContext();

  useEffect(() => {
    if (isUnsentFund) {
      setTitle("Transaction failed");
      setDescription(
        "We encountered an error while processing your transaction. Please try again after a few minutes."
      );
    } else if (isReverted) {
      setTitle("Transaction reverted");
      setDescription("");
    } else if (isConfirmed) {
      setTitle("Transaction confirmed");
      setDescription("Expect to receive your tokens in your wallet shortly.");
    } else {
      setTitle("Processing transaction");
      setDescription(
        "Do not refresh, leave the browser, or close the tab until transaction is complete. Doing so may interrupt the transaction and cause loss of funds."
      );
    }
  }, [isConfirmed, isReverted]);

  const handleRetrySend = async () => {
    if (txnHash !== undefined) {
      try {
        const fundData = await allocateDfcFund({
          txnHash,
        }).unwrap();

        if (fundData?.transactionHash !== undefined) {
          setTxnHash("confirmed", txnHash);
          setTxnHash("unsent-fund", null);
        }
      } catch ({ data }) {
        if (data?.statusCode === HttpStatusCode.TooManyRequests) {
          setDescription(
            "Retry limit has been reached, please wait for a minute and try again"
          );
        } else if (data?.error?.includes("Fund already allocated")) {
          setTxnHash("confirmed", txnHash);
          setTxnHash("unsent-fund", null);
        }
      }
    }
  };

  return (
    <div
      className={clsx(
        "flex-1 px-8 py-6 text-dark-1000 rounded-xl border bg-dark-100 ",
        isConfirmed
          ? "border-dark-card-stroke"
          : "dark-bg-gradient-1 border-transparent",
        isMd ? "mb-6" : "m-6",
        { "pr-6": isLg && isConfirmed }
      )}
    >
      {!isLg && !isUnsentFund && (
        <div className="pb-4">
          <ConfirmationProgress
            confirmationBlocksTotal={CONFIRMATIONS_BLOCK_TOTAL}
            confirmationBlocksCurrent={confirmationBlocksCurrent}
            isConfirmed={isConfirmed}
            isApiSuccess={isApiSuccess}
          />
        </div>
      )}

      <div
        className={clsx("flex flex-col lg:flex-row", {
          "items-center": !isUnsentFund,
        })}
      >
        <div className="flex-1 flex-col">
          <div className="leading-5 lg:text-xl lg:font-semibold">{title}</div>
          <div className="pt-1 text-sm text-dark-700">{description}</div>
          <div className="flex flex-row items-center mt-2 text-dark-900 text-xl font-bold ">
            <a
              className="flex flex-row items-center hover:opacity-70"
              href={`${ExplorerURL}/tx/${txnHash}`}
              target="_blank"
              rel="noreferrer"
            >
              <FiArrowUpRight size={20} className="mr-2" />
              View on Etherscan
            </a>
            {/* {ethTxnStatus.isConfirmed && (
              <a className="flex flex-row items-center hover:opacity-70 ml-5">
                <IoHelpCircle size={20} className="mr-2" />
                Help
              </a>
            )} */}
          </div>
        </div>
        {isUnsentFund && (
          <ActionButton
            label="Try again"
            variant="primary"
            customStyle="mt-6 lg:mt-0 text-dark-100 w-full lg:w-fit lg:h-[40px] lg:self-center lg:text-xs"
            onClick={handleRetrySend}
            isRefresh
          />
        )}
        {(isConfirmed || isUnsentFund) && !isLg && (
          <ActionButton
            label="Close"
            variant="secondary"
            customStyle="mt-6 dark-section-bg"
            onClick={onClose}
          />
        )}
        {isLg && (
          <div className="flex flex-row pl-8">
            {!isUnsentFund && (
              <ConfirmationProgress
                confirmationBlocksTotal={CONFIRMATIONS_BLOCK_TOTAL}
                confirmationBlocksCurrent={confirmationBlocksCurrent}
                isConfirmed={isConfirmed}
                isApiSuccess={isApiSuccess}
              />
            )}

            {(isConfirmed || isReverted || isUnsentFund) && (
              <div>
                <IoCloseOutline
                  onClick={onClose}
                  size={20}
                  className="hover:opacity-70 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
