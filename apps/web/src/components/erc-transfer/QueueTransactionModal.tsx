import { useState, useEffect } from "react";
import ActionButton from "@components/commons/ActionButton";
import Modal from "@components/commons/Modal";
import SearchQueuedTransactionButton from "@components/SearchQueuedTransactionButton";

export interface ModalConfigType {
  title: string;
  message: string;

  buttonLabel: string;
  // contractType: ContractType; // TODO: handle type when new SC is merged
  onClose: () => void;
}

export default function QueueTransactionModal({
  title,
  message,
  buttonLabel,
  onClose,
}: ModalConfigType) {
  const [copiedFromClipboard, setCopiedFromClipboard] =
    useState<boolean>(false);

  useEffect(() => {
    if (copiedFromClipboard) {
      setTimeout(() => setCopiedFromClipboard(false), 2000);
    }
  }, [copiedFromClipboard]);

  return (
    <Modal isOpen onClose={onClose}>
      <div className="flex flex-col md:mb-[46px] lg:mb-[80px] w-full justify-between h-full">
        <div>
          <div className="flex flex-col mb-6 md:mb-5 w-full md:px-6 md:items-center pb-[32px] md:pb-9 border-b border-dark-300 border-opacity-50">
            <SearchQueuedTransactionButton
              hasQueuedTransaction={false}
              onClick={() => {}}
              customImageSize="w-[33px] h-[33px]"
              customStyle="items-center flex justify-center w-[66px] h-[66px] -mt-14 md:mt-0"
            />
            <div className="font-bold text-xl lg:text-2xl text-dark-900 mt-4">
              {title}
            </div>
            <div className="text-sm lg:text-base lg:leading-5 text-dark-700 md:mt-2 md:text-center md:w-11/12">
              {message}
            </div>
          </div>

          <div className="grid gap-y-8 w-full text-sm lg:text-lg">
            <div className="text-dark-900 font-semibold text-xl tracking-[0.01em]">
              Transaction details
            </div>
            <div className="flex flex-row justify-between">
              <div className="text-dark-700 text-sm lg:text-base leading-5">
                Amount to receive
              </div>
              <div className="text-dark-1000 text-right">150 dBTC</div>
            </div>
            <div className="flex flex-row justify-between">
              <div className="text-dark-700 text-sm lg:text-base leading-5">
                Destination address
              </div>
              <div className="text-dark-1000 w-6/12 break-words text-right">
                dfa1123ZAaklz9012ZLasdalax1
              </div>
            </div>
            <div className="flex flex-row justify-between">
              <div className="flex flex-row">
                <div className="text-dark-700 text-sm lg:text-base leading-5">
                  Transaction hash
                </div>
              </div>
              <div className="text-dark-1000 text-right w-5/12 lg:w-[220px] break-all">
                0x11901fd641f3a2d3a986d6745a2ff1d5fea988eb
              </div>
            </div>
          </div>
        </div>

        <div className="md:mt-[40px] lg:mt-10 flex flex-col items-center justify-center">
          <ActionButton
            isExternalArrowIcon
            label={buttonLabel}
            customStyle="bg-dark-1000 text-sm lg:text-lg lg:px-[72px] max-w-[418px] min-h-[44px] max-h-[56px]"
            customIconStyle="ml-2"
            // onClick={() => {})}
          />
          <ActionButton
            variant="secondary"
            label="Copy transaction hash"
            customStyle="text-sm lg:text-lg lg:px-[72px] max-w-[418px] pt-[24px] pb-3.5"
            responsiveStyle=""
            // onClick={() => {}}
          />
        </div>
      </div>
    </Modal>
  );
}
