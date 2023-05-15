import * as React from "react";
import Modal from "@components/commons/Modal";
import dayjs from "dayjs";
import { FiArrowUpRight } from "react-icons/fi";
import GoToAnotherTransaction from "./GoToAnotherTransaction";
import { ModalTypeToDisplay } from "types";
import ActionButton from "@components/commons/ActionButton";
import Link from "next/link";

interface TransactionInProgressModalProps {
  type?: ModalTypeToDisplay;
  txHash: string;
  initiatedDate: Date;
  amount: string;
  token: string;
  destinationAddress?: string;
  onClose: () => void;
  onBack: () => void;
  isOpen: boolean;
}

export default function TransactionInProgressModal({
  type,
  txHash,
  initiatedDate,
  amount,
  token,
  destinationAddress,
  onClose,
  onBack,
  isOpen,
}: TransactionInProgressModalProps): JSX.Element {
  if (type === undefined) {
    return <></>;
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col mt-6 mb-4 w-full md:px-6">
        {type === ModalTypeToDisplay.Unsuccessful && (
          <Link
            href="https://birthdayresearch.notion.site/Error-Codes-d5c0bfd68359466e88223791e69adb4f"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            <span className="text-xs text-error flex items-center">
              Error code 12
              <FiArrowUpRight size={16} className="inline ml-1" />
            </span>
          </Link>
        )}
        <div className="font-bold text-xl lg:text-2xl text-dark-900">
          {titles[type]}
        </div>
        <div className="text-sm lg:text-base lg:leading-5 w-full text-dark-700 mt-2 mb-4">
          {descriptions[type]}
        </div>

        <span className="text-xs xl:tracking-wider text-dark-500 mb-9">
          TX Hash:
          <span className="text-dark-900 px-2 py-1 ml-2 bg-dark-200 rounded-[20px]">
            {txHash}
          </span>
        </span>

        <div className="h-px bg-dark-200 w-full md:mb-5 mb-6" />

        <div className="text-dark-900 md:text-xl font-semibold mb-6">
          Transaction details
        </div>
        <div className="flex items-center justify-between">
          <span className="text-dark-700">Date initiated</span>
          <span className="text-dark-1000">
            {dayjs(initiatedDate).format("DD/MM/YYYY HH:mm A")}
          </span>
        </div>
        <div className="flex items-center justify-between mt-8">
          <span className="text-dark-700">{amountLabel[type]}</span>
          <span className="text-dark-1000">{`${amount} ${token}`}</span>
        </div>
        {type === ModalTypeToDisplay.RefundInProgress && (
          <div className="flex justify-between mt-8">
            <span className="text-dark-700 w-2/4">Destination address</span>
            <span className="text-dark-1000 break-all w-2/4 text-right">
              {destinationAddress}
            </span>
          </div>
        )}

        {(type === ModalTypeToDisplay.Pending ||
          type === ModalTypeToDisplay.RefundInProgress) && (
          <div className="mt-14 text-center">
            <GoToAnotherTransaction onClick={onBack} />
          </div>
        )}
        {type === ModalTypeToDisplay.Unsuccessful && (
          <div className="mt-12 md:mt-8 lg:mt-10 flex justify-center">
            <ActionButton
              label="Request a refund"
              customStyle="bg-dark-1000 text-sm lg:text-lg lg:!py-3 lg:px-[72px] lg:w-fit min-w-[240px] min-h-[48px] lg:min-h-[52px]"
              onClick={() => {
                /* TODO: call refund api when ready */
              }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

const titles = {
  [ModalTypeToDisplay.Pending]: "Pending transaction",
  [ModalTypeToDisplay.RefundInProgress]: "Refund in progress",
  [ModalTypeToDisplay.Unsuccessful]: "Transaction unsuccessful",
};

const descriptions = {
  [ModalTypeToDisplay.Pending]:
    "Your transaction will be processed within the next 72 hours.",
  [ModalTypeToDisplay.RefundInProgress]:
    "Refund will be processed within the next 72 hours.",
  [ModalTypeToDisplay.Unsuccessful]:
    "The queue transaction couldn't be processed. Please try again.",
};

const amountLabel = {
  [ModalTypeToDisplay.Pending]: "Amount to receive",
  [ModalTypeToDisplay.RefundInProgress]: "Amount to refund",
  [ModalTypeToDisplay.Unsuccessful]: "Amount to receive",
};
