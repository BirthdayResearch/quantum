import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { ethers } from "ethers";
import ActionButton from "@components/commons/ActionButton";
import Modal from "@components/commons/Modal";
import { useContractContext } from "@contexts/ContractContext";
import useAutoResizeTextArea from "@hooks/useAutoResizeTextArea";
import { FiClipboard } from "react-icons/fi";
import { IoCloseCircle } from "react-icons/io5";
import Tooltip from "@components/commons/Tooltip";
import useResponsive from "@hooks/useResponsive";
import { useStorageContext } from "@contexts/StorageContext";
import { ModalTypeToDisplay } from "types";

export interface ModalConfigType {
  title: string;
  message: string;
  inputLabel: string;
  inputPlaceholder: string;
  buttonLabel: string;
  inputErrorMessage: string;
  // contractType: ContractType; // TODO: handle type when new SC is merged
  isOpen: boolean;
  onClose: () => void;
  onTransactionFound?: (modalTypeToDisplay: any) => void;
}

export enum ContractType {
  Instant,
  Queue,
}

export default function QueryTransactionModal({
  title,
  message,
  inputLabel,
  inputPlaceholder,
  buttonLabel,
  inputErrorMessage,
  isOpen,
  onClose,
  onTransactionFound,
}: ModalConfigType) {
  const { isMobile } = useResponsive();
  const { setStorage } = useStorageContext();
  const { BridgeV1, EthereumRpcUrl } = useContractContext();

  const [transactionInput, setTransactionInput] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);
  const [isValidTransaction, setIsValidTransaction] = useState(true);
  const [copiedFromClipboard, setCopiedFromClipboard] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  useAutoResizeTextArea(textAreaRef.current, [transactionInput]);

  const provider = new ethers.providers.JsonRpcProvider(EthereumRpcUrl);
  const bridgeIface = new ethers.utils.Interface(BridgeV1.abi); // TODO: use new abi from new SC
  // eslint-disable-next-line
  const checkTXnHash = async () => {
    try {
      setIsLoading(true);
      const receipt = await provider.getTransaction(transactionInput);
      const decodedData = bridgeIface.parseTransaction({ data: receipt.data });
      if (receipt && decodedData?.name !== "bridgeToDeFiChain") {
        // TODO: add condition to check decodedData.name of new SC
        setIsValidTransaction(false);
        return;
      }
      if (receipt) {
        setStorage("unconfirmed", transactionInput);
        setIsValidTransaction(true);
        // TODO: add logic to call get queue tx from db and navigate to corresponding modal
        return;
      }
      setIsValidTransaction(false);
    } catch (error) {
      setIsValidTransaction(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocusWithCursor = () => {
    setIsFocused(true);
    setTimeout(() => {
      // Only added timeout for ref's unexplained delay
      const textArea = textAreaRef.current;
      const cursorPosition = transactionInput.length;
      if (textArea) {
        textArea.setSelectionRange(cursorPosition, cursorPosition);
        textArea.focus();
      }
    }, 0);
  };

  const invalidTxnHash = !!transactionInput && !isValidTransaction;

  const handlePasteBtnClick = async () => {
    setIsValidTransaction(true);
    const copiedText = await navigator.clipboard.readText();
    if (copiedText) {
      setTransactionInput(copiedText);
      setCopiedFromClipboard(true);
    }
  };

  useEffect(() => {
    if (copiedFromClipboard) {
      setTimeout(() => setCopiedFromClipboard(false), 2000);
    }
  }, [copiedFromClipboard]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col mt-6 mb-4 w-full md:px-6">
        <div className="font-bold text-2xl md:text-xl lg:text-2xl text-dark-900 md:-mt-6">
          {title}
        </div>
        <div className="text-sm lg:text-base lg:leading-5 w-full text-dark-700 mt-1">
          {message}
        </div>

        <div className="md:h-5 lg:h-7 group relative flex items-center mt-8">
          <span className="text-xs font-semibold xl:tracking-wider lg:text-base text-dark-900">
            {inputLabel}
          </span>
          <div
            className={clsx(
              "absolute right-0 rounded bg-valid px-2 py-1 text-2xs text-dark-00 transition duration-300 lg:text-xs",
              copiedFromClipboard ? "opacity-100" : "opacity-0"
            )}
          >
            Added from clipboard
          </div>
        </div>

        <div
          className={clsx(
            "relative flex min-h-[52px] items-center rounded-lg border py-2.5 pr-3.5 pl-4 mt-2",
            {
              "border-error": invalidTxnHash,
              "before:dark-gradient-2 z-0 border-transparent before:-inset-[1px] before:rounded-lg before:p-px":
                isFocused && !invalidTxnHash,
              "border-dark-300 hover:border-dark-500": !(
                invalidTxnHash || isFocused
              ),
            }
          )}
        >
          {/* Paste icon with tooltip */}
          <Tooltip
            content="Paste from clipboard"
            containerClass="mr-3 shrink-0 cursor-pointer hover:bg-dark-200 active:dark-btn-pressed"
            disableTooltip={isMobile}
          >
            <FiClipboard
              size={20}
              className="text-dark-1000"
              onMouseDown={handlePasteBtnClick}
            />
          </Tooltip>

          {/* Textarea input */}
          <textarea
            ref={textAreaRef}
            className={clsx(
              `w-full h-6 grow resize-none bg-transparent text-sm lg:text-base leading-5 tracking-[0.01em] text-dark-1000 focus:outline-none`,
              isFocused
                ? "placeholder:text-dark-300"
                : "placeholder:text-dark-500"
            )}
            placeholder={inputPlaceholder}
            value={transactionInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setTransactionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            spellCheck={false}
          />

          {/* Clear icon */}
          {transactionInput.length > 0 && (
            <IoCloseCircle
              size={20}
              className="ml-2 mr-1 shrink-0 cursor-pointer fill-dark-500"
              onMouseDown={() => {
                setTransactionInput("");
                setIsValidTransaction(true);
                handleFocusWithCursor();
              }}
            />
          )}
        </div>

        {/* Error messages */}
        {invalidTxnHash && (
          <span className="block pt-2 text-xs lg:text-sm empty:before:content-['*'] empty:before:opacity-0 text-error">
            {inputErrorMessage}
          </span>
        )}

        <div className="mt-12 md:mt-8 lg:mt-10 flex justify-center">
          <ActionButton
            label={isLoading ? "" : buttonLabel}
            customStyle="bg-dark-1000 text-sm lg:text-lg lg:!py-3 lg:px-[72px] lg:w-fit min-w-[251.72px] min-h-[48px] lg:min-h-[52px]"
            disabled={transactionInput === "" || isLoading} // TODO: comment to test different modal
            // onClick={checkTXnHash} // TODO: comment to test different modal
            onClick={() => {
              // TODO: remove after testing, uncomment to test different modal
              if (!onTransactionFound) {
                return;
              }
              onTransactionFound(ModalTypeToDisplay.Pending);
              // onTransactionFound(ModalTypeToDisplay.RefundInProgress);
              // onTransactionFound(ModalTypeToDisplay.Unsuccessful);
            }}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Modal>
  );
}
