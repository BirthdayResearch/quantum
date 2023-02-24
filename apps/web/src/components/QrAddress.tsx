import QRCode from "react-qr-code";
import clsx from "clsx";
import { useState } from "react";
import useCopyToClipboard from "@hooks/useCopyToClipboard";
import Tooltip from "@components/commons/Tooltip";
import { useStorageContext } from "@contexts/StorageContext";
import { RiLoader2Line } from "react-icons/ri";
import { IoCheckmarkCircle } from "react-icons/io5";
import TimeLimitCounter from "./erc-transfer/TimeLimitCounter";
import { ValidationStatusLabel } from "./erc-transfer/StepThreeVerification";

function SuccessCopy({
  containerClass,
  show,
}: {
  containerClass: string;
  show: boolean;
}) {
  return (
    <div
      className={clsx(
        "absolute md:w-full text-center",
        show ? "opacity-100" : "opacity-0",
        containerClass
      )}
    >
      <span className="rounded bg-valid px-2 py-1 text-xs text-dark-00  transition duration-300 md:text-xs">
        Copied to clipboard
      </span>
    </div>
  );
}

export default function QrAddress({
  dfcUniqueAddress,
  createdBeforeInMSec,
  setDfcUniqueAddress,
  setIsAddressExpired,
  validationStatus,
}: {
  dfcUniqueAddress: string;
  createdBeforeInMSec?: number;
  setDfcUniqueAddress?: (string) => void;
  setIsAddressExpired?: (boolean) => void;
  validationStatus?: string;
}) {
  const [showSuccessCopy, setShowSuccessCopy] = useState(false);
  const { copy } = useCopyToClipboard();
  const { setStorage } = useStorageContext();

  const handleOnCopy = (text) => {
    copy(text);
    setShowSuccessCopy(true);
  };

  return (
    <div className="w-[164px]">
      <SuccessCopy
        containerClass="m-auto right-0 left-0 top-2"
        show={showSuccessCopy}
      />
      <div className="h-[164px] bg-dark-1000 p-0.5 rounded">
        <QRCode value={dfcUniqueAddress} size={160} />
      </div>
      <div className="flex flex-col">
        <Tooltip
          content="Click to copy address"
          containerClass={clsx("relative mt-1")}
        >
          <button
            type="button"
            className={clsx(
              "text-dark-700 text-left break-all focus-visible:outline-none text-center mt-2",
              "text-xs cursor-pointer hover:underline"
            )}
            onClick={() => handleOnCopy(dfcUniqueAddress)}
          >
            {dfcUniqueAddress}
          </button>
        </Tooltip>
        {createdBeforeInMSec && createdBeforeInMSec > 0 && (
          <div className="text-center">
            <TimeLimitCounter
              time={createdBeforeInMSec}
              onTimeElapsed={() => {
                setStorage("dfc-address", null);
                if (setDfcUniqueAddress !== undefined) {
                  setDfcUniqueAddress("");
                }
                if (setIsAddressExpired !== undefined) {
                  setIsAddressExpired(true);
                }
              }}
            />
          </div>
        )}
        {validationStatus && (
          <div
            className={clsx(
              "flex flex-row w-full items-center justify-center text-xs mt-3",
              validationStatus === ValidationStatusLabel.Validating
                ? "text-warning"
                : "text-valid"
            )}
          >
            {validationStatus}
            {validationStatus === ValidationStatusLabel.Validating ? (
              <RiLoader2Line
                size={16}
                className={clsx("inline-block animate-spin ml-1")}
              />
            ) : (
              <IoCheckmarkCircle
                size={16}
                className={clsx("inline-block ml-1")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
