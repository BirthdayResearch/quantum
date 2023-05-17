import BigNumber from "bignumber.js";
import { FiArrowUpRight } from "react-icons/fi";
import { RiLoader2Line } from "react-icons/ri";
import { IoCheckmarkCircle } from "react-icons/io5";
import { useEffect, useState } from "react";
import clsx from "clsx";

import { useAllocateDfcFundMutation } from "@store/index";
import { HttpStatusCode } from "axios";
import useTimeout from "@hooks/useSetTimeout";
import { useQueueStorageContext } from "@contexts/QueueStorageContext";
import { useDeFiScanContext } from "@contexts/DeFiScanContext";
import { EVM_CONFIRMATIONS_BLOCK_TOTAL } from "../constants";
import ConfirmationProgress from "./TransactionConfirmationProgressBar";
import useResponsive from "../hooks/useResponsive";
import { useContractContext } from "../layouts/contexts/ContractContext";
import ActionButton from "./commons/ActionButton";

export default function QueueTransactionStatus({
  isConfirmed,
  isApiSuccess,
  isReverted,
  isUnsentFund,
  ethTxnStatusIsConfirmed,
  numberOfEvmConfirmations,
  allocationTxnHash,
  txnHash,
}: {
  isConfirmed: boolean;
  isApiSuccess: boolean;
  isReverted: boolean;
  isUnsentFund: boolean;
  ethTxnStatusIsConfirmed: boolean;
  numberOfEvmConfirmations: string;
  allocationTxnHash?: string;
  txnHash: string | undefined;
}) {
  const { ExplorerURL } = useContractContext();
  const { isLg, isMd, is2xl } = useResponsive();

  const [allocateDfcFund] = useAllocateDfcFundMutation();
  const { setStorage } = useQueueStorageContext();
  const { getTransactionUrl } = useDeFiScanContext();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isThrottleLimitReached, setIsThrottleLimitReached] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const confirmationBlocksCurrent = BigNumber.min(
    EVM_CONFIRMATIONS_BLOCK_TOTAL,
    new BigNumber(numberOfEvmConfirmations)
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
      setTitle("Transaction is reverted");
      setDescription(
        "Something went wrong as the transaction was being processed. Please wait for the required confirmations to proceed with your transaction."
      );
    } else if (isConfirmed) {
      setTitle("Transaction confirmed");
      setDescription(
        "Please wait for a few seconds while we generate your Queue transaction."
      );
    } else {
      setTitle("Awaiting confirmation");
      setDescription(
        "Please wait as we are processing your transaction. Once completed, it will be added to Queue."
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
          setStorage("allocation-txn-hash-queue", fundData?.transactionHash);
          setStorage("confirmed-queue", txnHash);
          setStorage("unsent-fund-queue", null);
        }
      } catch ({ data }) {
        if (data?.statusCode === HttpStatusCode.TooManyRequests) {
          setIsThrottleLimitReached(true);
          throttledTimeOut();
          setDescription(
            "Retry limit has been reached, please wait for a minute and try again"
          );
        } else if (data?.error?.includes("Fund already allocated")) {
          setStorage("confirmed-queue", txnHash);
          setStorage("unsent-fund-queue", null);
        }
      } finally {
        setIsRetrying(false);
      }
    }
  };

  return (
    <div
      className={clsx(
        "text-dark-1000 border-b border-b-dark-200 mb-[34px] lg:mb-[44px] lg:pb-[34px]",
        {
          "border-warning": isReverted,
          "border-error": isUnsentFund,
          "border-dark-card-stroke": isConfirmed,
          "pb-6": isMd,
          "pt-2 pb-6": !isMd,
        }
      )}
    >
      {!isLg && !isUnsentFund && (
        <div className="pb-6">
          <ConfirmationProgress
            confirmationBlocksTotal={EVM_CONFIRMATIONS_BLOCK_TOTAL}
            confirmationBlocksCurrent={confirmationBlocksCurrent}
            isConfirmed={isConfirmed}
            isReverted={isReverted}
            isUnsentFund={isUnsentFund}
            isApiSuccess={isApiSuccess}
            txnType="Ethereum"
          />
        </div>
      )}

      <div
        className={clsx("flex flex-col lg:flex-row", {
          "items-center": !isUnsentFund,
        })}
      >
        <div className="flex-1 flex-col w-full">
          <div className="leading-5 lg:text-xl font-semibold">{title}</div>
          <div className="pt-1 text-sm text-dark-700">{description}</div>
          <div
            className={clsx("flex mt-6 text-xs lg:text-base lg:leading-5", {
              "lg:mt-11": isConfirmed,
            })}
          ></div>
        </div>
        {isUnsentFund && (
          <ActionButton
            label="Try again"
            variant="primary"
            customStyle="mt-6 lg:mt-0 text-dark-100 whitespace-nowrap w-full lg:w-fit xl:px-5 xl:py-2.5 lg:h-[40px] lg:self-center lg:text-xs"
            onClick={handleRetrySend}
            disabled={isThrottleLimitReached || isRetrying}
            isRefresh={!isRetrying}
            isLoading={isRetrying}
          />
        )}
        {isLg && !isUnsentFund && (
          <div className="flex flex-row pl-8">
            <ConfirmationProgress
              confirmationBlocksTotal={EVM_CONFIRMATIONS_BLOCK_TOTAL}
              confirmationBlocksCurrent={confirmationBlocksCurrent}
              isConfirmed={isConfirmed}
              isReverted={isReverted}
              isUnsentFund={isUnsentFund}
              isApiSuccess={isApiSuccess}
              txnType="Ethereum"
            />
          </div>
        )}
      </div>
    </div>
  );
}
