import clsx from "clsx";
import { useState, useEffect } from "react";
import { FiAlertCircle, FiCopy } from "react-icons/fi";
import QRCode from "react-qr-code";
import useCopyToClipboard from "@hooks/useCopyToClipboard";
import useResponsive from "@hooks/useResponsive";
import { getStorageItem, setStorageItem } from "@utils/localStorage";
import Tooltip from "@components/commons/Tooltip";
import UtilityButton from "@components/commons/UtilityButton";
import { useRouter } from "next/router";
import TimeLimitCounter from "./TimeLimitCounter";
import { STORAGE_DFC_ADDR_KEY } from "../../constants";

const generateDfcUniqueAddress = () => {
  const localDfcAddress = getStorageItem<string>(STORAGE_DFC_ADDR_KEY);
  if (localDfcAddress) {
    return localDfcAddress;
  }

  // TODO: Replace with real api function to generate unique DFC address
  const address: string = Array.from(Array(42), () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join("");
  setStorageItem<string>(STORAGE_DFC_ADDR_KEY, address);
  return address;
};

function VerifyButton({
  onVerify,
  disabled = false,
}: {
  onVerify: () => void;
  disabled?: boolean;
}) {
  return (
    <UtilityButton
      label="Verify transfer"
      onClick={onVerify}
      disabled={disabled}
      withArrowIcon
    />
  );
}

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
        "absolute md:w-full md:text-center",
        show ? "opacity-100" : "opacity-0",
        containerClass
      )}
    >
      <span className="rounded bg-valid px-2 py-1 text-2xs text-dark-00  transition duration-300 md:text-xs">
        Copied to clipboard
      </span>
    </div>
  );
}

export default function StepTwoSendConfirmation({
  goToNextStep,
}: {
  goToNextStep: () => void;
}) {
  const [dfcUniqueAddress, setDfcUniqueAddress] = useState<string>("");
  const [showSuccessCopy, setShowSuccessCopy] = useState(false);
  const [hasTimeElapsed, setHasTimeElapsed] = useState(false);

  const { isMobile } = useResponsive();
  const { copy } = useCopyToClipboard();
  const router = useRouter();

  const handleConfirmClick = () => {
    goToNextStep();
  };

  const handleOnCopy = (text) => {
    copy(text);
    setShowSuccessCopy(true);
  };

  const handleGenerateNewDfcAddress = () => {
    const newAddress = generateDfcUniqueAddress();
    setDfcUniqueAddress(newAddress);
    setHasTimeElapsed(false);
  };

  useEffect(() => {
    const uniqueAddress = generateDfcUniqueAddress();
    setDfcUniqueAddress(uniqueAddress);
  }, []);

  useEffect(() => {
    if (showSuccessCopy) {
      setTimeout(() => setShowSuccessCopy(false), 2000);
    }
  }, [showSuccessCopy]);

  return (
    <div className={clsx("flex flex-col mt-6", "md:flex-row md:gap-7 md:mt-4")}>
      <div
        className={clsx(
          "w-full flex flex-row gap-4 order-1 mt-8",
          "md:w-2/5 md:flex-col md:shrink-0 md:gap-3 md:order-none md:border-[0.5px] border-dark-200 rounded md:px-5 md:pt-4 md:pb-3 md:mt-0",
          { "justify-center": hasTimeElapsed }
        )}
      >
        {hasTimeElapsed ? (
          <div className="flex flex-col items-center justify-center">
            <FiAlertCircle size={48} className="text-dark-1000" />
            <span className="text-center text-xs text-dark-900 mt-6 mb-4">
              Address has expired and is now unavailable for use.
            </span>
            <div className="w-full px-6 md:w-auto md:px-0 md:pb-2">
              <UtilityButton
                label="Generate again"
                variant="secondary"
                onClick={() => handleGenerateNewDfcAddress()}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="w-[164px] h-[164px] bg-dark-1000 p-0.5 md:rounded">
              <QRCode value={dfcUniqueAddress} size={160} />
            </div>
            <div className="flex flex-col">
              <Tooltip
                content="Click to copy address"
                containerClass={clsx("relative pt-0 mt-1", {
                  "cursor-default": isMobile,
                })}
                disableTooltip={isMobile}
              >
                <button
                  type="button"
                  className={clsx(
                    "text-sm text-dark-900 text-left break-all focus-visible:outline-none",
                    "md:text-xs md:text-center md:cursor-pointer md:hover:underline"
                  )}
                  onClick={() => !isMobile && handleOnCopy(dfcUniqueAddress)}
                >
                  {dfcUniqueAddress}
                </button>
                {!isMobile && (
                  <SuccessCopy
                    containerClass="bottom-11"
                    show={showSuccessCopy}
                  />
                )}
              </Tooltip>
              {isMobile && (
                <>
                  <button
                    type="button"
                    className="relative flex items-center text-dark-700 active:text-dark-900 mt-2"
                    onClick={() => handleOnCopy(dfcUniqueAddress)}
                  >
                    <FiCopy size={16} className="mr-2" />
                    <span className="text-sm font-semibold">Copy address</span>
                    <SuccessCopy
                      containerClass="bottom-7"
                      show={showSuccessCopy}
                    />
                  </button>
                  {!hasTimeElapsed && (
                    <TimeLimitCounter
                      onTimeElapsed={() => setHasTimeElapsed(true)}
                    />
                  )}
                </>
              )}
              {!isMobile && !hasTimeElapsed && (
                <TimeLimitCounter
                  onTimeElapsed={() => setHasTimeElapsed(true)}
                />
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex flex-col justify-center grow">
        <span className="font-semibold tracking-wider text-dark-900">
          Transfer funds for release
        </span>
        <p className={clsx("text-sm text-dark-700 mt-1", "md:mt-2")}>
          Use your DeFiChain wallet to send the amount that you want to transfer
          through the Bridge. Make sure you send the correct amount to the
          correct address.
        </p>
        <span className={clsx("text-sm text-warning mt-1", "md:mt-2")}>
          Transactions in this Bridge, as with all other on-chain transactions,
          are irreversible. For more details, read
          <button
            type="button"
            className="underline underline-offset-1 text-warning"
            onClick={() => router.push("/faq")}
          >
            FAQs and terms of use.
          </button>
        </span>

        <div className={clsx("hidden mt-12", "md:block")}>
          <div className="float-right">
            {/* Web confirm button */}
            <VerifyButton
              onVerify={handleConfirmClick}
              disabled={hasTimeElapsed}
            />
          </div>
        </div>
      </div>

      <div className={clsx("order-last pt-6", "md:hidden")}>
        <div className={clsx("px-6 pt-12", "md:px-0")}>
          {/* Mobile confirm button */}
          <VerifyButton
            onVerify={handleConfirmClick}
            disabled={hasTimeElapsed}
          />
        </div>
      </div>
    </div>
  );
}
