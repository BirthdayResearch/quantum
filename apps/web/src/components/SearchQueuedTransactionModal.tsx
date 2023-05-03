import { useState } from "react";
import { FiClipboard } from "react-icons/fi";
import { IoCloseCircleSharp } from "react-icons/io5";
import Modal from "./commons/Modal";

export function SearchQueuedTransactionModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}): JSX.Element {
  // const [copiedFromClipboard, setCopiedFromClipboard] = useState(false);
  const [transactionInput, setTransactionInput] = useState("");
  const handlePasteBtnClick = async () => {
    const clipboardText = await navigator.clipboard.readText();
    if (clipboardText) {
      setTransactionInput(clipboardText);
      // setCopiedFromClipboard(true);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="font-bold text-2xl text-dark-900 mb-2">
        Track transaction
      </div>
      <div className="text-dark-700 mb-9">
        Enter transaction hash of a queue transaction to track its status.
      </div>
      <div className="font-semibold lg:text-sm text-xs text-dark-900 mb-3">
        Transaction hash
      </div>
      <div className="rounded-[15px] border-[1px] border-dark-200 flex py-4 px-6 items-center mb-10">
        <FiClipboard
          size={20}
          className="text-dark-1000 mr-4"
          onMouseDown={handlePasteBtnClick}
        />
        <input
          placeholder="Enter transaction hash"
          className="w-full bg-transparent placeholder-dark-500 focus:outline-none text-dark-1000 text-sm lg:text-base"
          value={transactionInput}
          onChange={(e) => setTransactionInput(e.target.value)}
        />
        {transactionInput !== "" && (
          <IoCloseCircleSharp
            size={20}
            onClick={() => setTransactionInput("")}
            className="text-dark-500 self-center cursor-pointer ml-4"
          />
        )}
      </div>
      <div className="text-center">
        <button className="py-3 px-[72px] font-bold lg:text-lg text-sm bg-dark-1000 rounded-[92px]">
          Track status
        </button>
      </div>
      <div className="mt-3 block md:hidden text-center">
        <button
          className="py-3 px-[72px] text-dark-1000 font-bold lg:text-lg text-sm rounded-[92px]"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
