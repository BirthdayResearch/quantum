import BigNumber from "bignumber.js";
import { FiArrowUpRight } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { useEffect, useState } from "react";
import clsx from "clsx";
import truncateTextFromMiddle from "@utils/textHelper";

import { useAllocateDfcFundMutation } from "@store/index";
import { HttpStatusCode } from "axios";
import useTimeout from "@hooks/useSetTimeout";
import { useStorageContext } from "@contexts/StorageContext";
import { useDeFiScanContext } from "@contexts/DeFiScanContext";
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
  allocationTxnHash,
  txnHash,
  onClose,
}: {
  isConfirmed: boolean;
  isApiSuccess: boolean;
  isReverted: boolean;
  isUnsentFund: boolean;
  numberOfConfirmations: string;
  allocationTxnHash?: string;
  txnHash: string | undefined;
  onClose: () => void;
}) {
  const { ExplorerURL } = useContractContext();
  const { isLg, isMd } = useResponsive();

  const [allocateDfcFund] = useAllocateDfcFundMutation();
  const { setStorage } = useStorageContext();
  const { getTransactionUrl } = useDeFiScanContext();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isThrottleLimitReached, setIsThrottleLimitReached] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const confirmationBlocksCurrent = BigNumber.min(
    CONFIRMATIONS_BLOCK_TOTAL,
    numberOfConfirmations
  ).toFixed();

  const [throttledTimeOut] = useTimeout(() => {
    setIsThrottleLimitReached(false);
  }, 60000);

  useEffect(() => {
    if (isUnsentFund) {
      setTitle("Transaction failed");
      setDescription(
        "We encountered an error while processing your transaction. Please try again after a few minutes."
      );
    } else if (isReverted) {
      setTitle("Transaction reverted");
      setDescription(
        "Something went wrong as the transaction was being processed. Please wait for the required confirmations to proceed with your transaction."
      );
    } else if (isConfirmed) {
      setTitle("Transaction confirmed");
      setDescription("Expect to receive your tokens in your wallet shortly.");
    } else {
      setTitle("Processing transaction");
      setDescription(
        "Do not refresh, leave the browser, or close the tab until transaction is complete. Doing so may interrupt the transaction and cause loss of funds."
      );
    }
  }, [isConfirmed, isReverted, isUnsentFund]);

  const handleRetrySend = async () => {
    if (txnHash !== undefined) {
      try {
        setIsRetrying(true);
        const fundData = await allocateDfcFund({
          txnHash,
        }).unwrap();

        if (fundData?.transactionHash !== undefined) {
          setStorage("allocationTxnHash", fundData?.transactionHash);
          setStorage("confirmed", txnHash);
          setStorage("unsent-fund", null);
        }
      } catch ({ data }) {
        if (data?.statusCode === HttpStatusCode.TooManyRequests) {
          setIsThrottleLimitReached(true);
          throttledTimeOut();
          setDescription(
            "Retry limit has been reached, please wait for a minute and try again"
          );
        } else if (data?.error?.includes("Fund already allocated")) {
          setStorage("confirmed", txnHash);
          setStorage("unsent-fund", null);
        }
      } finally {
        setIsRetrying(false);
      }
    }
  };

  return (
    <div
      className={clsx(
        "flex-1 px-8 py-6 text-dark-1000 rounded-xl border bg-dark-100",
        {
          "border-warning": isReverted,
          "border-error": isUnsentFund,
          "border-dark-card-stroke": isConfirmed,
          "dark-bg-gradient-1 border-transparent":
            !isConfirmed && !isUnsentFund,
          "mb-6": isMd,
          "m-6": !isMd,
          "pr-6": isLg && isConfirmed,
        }
      )}
    >
      {!isLg && !isUnsentFund && (
        <div className="pb-4">
          <ConfirmationProgress
            confirmationBlocksTotal={CONFIRMATIONS_BLOCK_TOTAL}
            confirmationBlocksCurrent={confirmationBlocksCurrent}
            isConfirmed={isConfirmed}
            isReverted={isReverted}
            isUnsentFund={isUnsentFund}
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
          <div className="leading-5 lg:text-xl font-semibold">{title}</div>
          <div className="pt-1 text-sm text-dark-700">{description}</div>
          {allocationTxnHash && (
            <div className="flex flex-row items-center mt-2.5 text-dark-900 lg:text-lg font-bold ">
              <a
                className="flex flex-row items-center hover:opacity-70"
                href={getTransactionUrl(allocationTxnHash)}
                target="_blank"
                rel="noreferrer"
              >
                <FiArrowUpRight size={16} className="mr-2" />
                View on DeFiScan:{" "}
                {truncateTextFromMiddle(allocationTxnHash, isLg ? 5 : 4)}
              </a>
            </div>
          )}
          <div className="flex flex-row items-center mt-2.5 text-dark-900 text-sm lg:text-base font-bold ">
            <a
              className="flex flex-row items-center hover:opacity-70"
              href={`${ExplorerURL}/tx/${txnHash}`}
              target="_blank"
              rel="noreferrer"
            >
              <FiArrowUpRight size={20} className="mr-2" />
              View on Etherscan
            </a>
            {/*
             {ethTxnStatus.isConfirmed && (
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
            disabled={isThrottleLimitReached || isRetrying}
            isRefresh={!isRetrying}
            isLoading={isRetrying}
          />
        )}
        {(isConfirmed || isReverted) && !isLg && (
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
                isReverted={isReverted}
                isUnsentFund={isUnsentFund}
                isApiSuccess={isApiSuccess}
              />
            )}

            {(isConfirmed || isReverted) && (
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
