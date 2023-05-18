import * as React from "react";
import Modal from "@components/commons/Modal";
import dayjs from "dayjs";
import { ModalTypeToDisplay } from "types";
import ActionButton from "@components/commons/ActionButton";
import useResponsive from "@hooks/useResponsive";
import truncateTextFromMiddle from "@utils/textHelper";

interface TransactionInProgressModalProps {
  type?: ModalTypeToDisplay;
  txHash: string;
  initiatedDate: Date;
  amount: string;
  token: string;
  onClose: () => void;
  isOpen: boolean;
}

const titles = {
  [ModalTypeToDisplay.Successful]: "Refund successful",
};

const descriptions = {
  [ModalTypeToDisplay.Successful]:
    "Please check your MetaMask wallet for your refunded tokens.",
};

const amountLabel = {
  [ModalTypeToDisplay.Successful]: "Amount refunded",
};

export default function RefundModal({
  type,
  txHash,
  initiatedDate,
  amount,
  token,
  onClose,
  isOpen,
}: TransactionInProgressModalProps): JSX.Element {
  const { isMobile } = useResponsive();

  if (type === undefined) {
    // eslint-disable-next-line
    return <></>;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col md:mt-6 md:mb-4 w-full md:px-6 h-full md:h-auto -mt-[60px]">
        <div className="flex flex-col md:items-center md:justify-center">
          <div className="content-[url('/check-24x24.svg')] w-[49.5px]" />
          <div className="pt-6 font-bold text-2xl md:text-xl lg:text-2xl leading-8 md:leading-7 lg:!leading-8 text-dark-1000 tracking-[0.01em] md:text-center">
            {titles[type]}
          </div>
          <div className="text-sm lg:text-base leading-5 w-10/12 text-dark-700 mt-1 mb-4 md:mb-5 lg:mb-4 md:text-center">
            {descriptions[type]}
          </div>
        </div>

        <span className="text-xs xl:tracking-wider text-dark-500 mb-8 md:mb-7 items-center md:flex md:justify-center">
          TX Hash:
          <span className="text-dark-900 px-2 py-1 ml-2 bg-dark-200 rounded-[20px]">
            {isMobile ? truncateTextFromMiddle(txHash, 15) : txHash}
          </span>
        </span>

        <div className="h-px bg-dark-200 w-full md:mb-5 mb-6" />

        <div className="text-dark-900 md:text-xl font-semibold md:mb-6 mb-8">
          Transaction details
        </div>

        <div className="flex items-center justify-between">
          <span className="text-dark-700">{amountLabel[type]}</span>
          <span className="text-dark-1000">{`${amount} ${token}`}</span>
        </div>

        <div className="flex items-center justify-between md:mt-8 mt-10">
          <span className="text-dark-700">Refund TX hash</span>
          <span className="text-dark-1000 break-words w-5/12 text-right">
            {txHash}
          </span>
        </div>

        <div className="flex items-center justify-between md:mt-8 mt-10">
          <span className="text-dark-700">Timestamp</span>
          <span className="text-dark-1000">
            {dayjs(initiatedDate).format("DD/MM/YYYY HH:mm A")}
          </span>
        </div>

        <div className="mt-12 md:mt-[104px] flex justify-center h-full items-end">
          <ActionButton
            isExternalArrowIcon
            label="View on DeFiScan"
            customIconStyle="ml-2"
            customStyle="bg-dark-1000 text-sm lg:text-lg lg:!py-3 lg:px-[72px] lg:w-fit lg:w-[418px] max-w-[418px] min-w-[240px] min-h-[48px] lg:min-h-[52px]"
            onClick={() => {
              window.open(
                `https://defiscan.live/transactions/${txHash}`,
                "_blank",
                "noopener noreferrer"
              );
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
