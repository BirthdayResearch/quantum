import clsx from "clsx";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { FiAlertCircle, FiLoader } from "react-icons/fi";
import QRCode from "react-qr-code";
import useCopyToClipboard from "@hooks/useCopyToClipboard";
import Tooltip from "@components/commons/Tooltip";
import UtilityButton from "@components/commons/UtilityButton";
import { useGenerateAddressMutation } from "@store/index";
import { HttpStatusCode } from "axios";
import { AddressDetails } from "types";
import dayjs from "dayjs";
import AddressError from "@components/commons/AddressError";
import { useStorageContext } from "@contexts/StorageContext";
import { DFC_TO_ERC_RESET_FORM_TIME_LIMIT } from "../../constants";
import TimeLimitCounter from "./TimeLimitCounter";

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    const context = this;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      func.apply(context, args);
    }, wait);
  };
}

function getTimeDifference(createdAt?: Date): number {
  if (createdAt) {
    return dayjs(createdAt)
      .add(DFC_TO_ERC_RESET_FORM_TIME_LIMIT, "millisecond")
      .diff(dayjs());
  }
  return 0;
}

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

function FaqSection() {
  return (
    <div className="mt-6 md:mt-2">
      <span className={clsx("text-sm text-warning", "md:mt-2")}>
        Transactions in this Bridge, as with all other on-chain transactions,
        are irreversible. For more details, read&nbsp;
        <Link
          href="https://birthdayresearch.notion.site/Troubleshooting-477ed1d364c0406abc33f162e985d5b3"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-1 text-warning"
        >
          FAQs and terms of use.
        </Link>
      </span>
    </div>
  );
}

export default function StepTwoSendConfirmation({
  goToNextStep,
  refundAddress,
  addressDetail,
}: {
  goToNextStep: () => void;
  refundAddress: string;
  addressDetail?: AddressDetails;
}) {
  const [dfcUniqueAddress, setDfcUniqueAddress] = useState<string>("");
  const [showSuccessCopy, setShowSuccessCopy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressExpired, setIsAddressExpired] = useState(false);
  const [createdBeforeInMSec, setCreatedBeforeInMSec] = useState(
    getTimeDifference(addressDetail?.createdAt)
  );
  const [addressGenerationError, setAddressGenerationError] = useState("");
  const [generateAddress] = useGenerateAddressMutation();
  const { copy } = useCopyToClipboard();
  const { setStorage, dfcAddress } = useStorageContext();

  const handleConfirmClick = () => {
    goToNextStep();
  };

  const handleOnCopy = (text) => {
    copy(text);
    setShowSuccessCopy(true);
  };

  const generateDfcUniqueAddress = useCallback(
    debounce(async () => {
      setIsLoading(true);

      if (dfcAddress) {
        setDfcUniqueAddress(dfcAddress);
        setIsLoading(false);
      } else {
        try {
          const { address, createdAt } = await generateAddress({
            refundAddress,
          }).unwrap();
          setCreatedBeforeInMSec(getTimeDifference(createdAt));
          setStorage("dfc-address", address);
          setStorage(
            "dfc-address-details",
            JSON.stringify({ address, createdAt, refundAddress })
          );
          setAddressGenerationError("");
          setDfcUniqueAddress(address);
        } catch ({ data }) {
          if (data?.statusCode === HttpStatusCode.TooManyRequests) {
            setAddressGenerationError(
              "Address generation limit reached, please wait for a minute and try again"
            );
          } else {
            setAddressGenerationError(data?.error);
          }
          setDfcUniqueAddress("");
        } finally {
          setIsLoading(false);
        }
      }
    }, 200),
    [dfcAddress]
  );

  useEffect(() => {
    generateDfcUniqueAddress();
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
          "max-w-max mx-auto flex flex-row order-1 mt-6 justify-start border-[0.5px] border-dark-200 rounded",
          "md:w-2/5 md:flex-col md:shrink-0 md:order-none px-6 pt-6 pb-3 md:mt-0"
        )}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center mt-12 w-[164px]">
            <FiAlertCircle size={48} className="text-dark-1000" />
            <span className="text-center text-xs text-dark-900 mt-6 mb-4">
              Generating address
            </span>
            <FiLoader size={24} className="animate-spin text-brand-100" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-[164px] relative">
              {isAddressExpired ? (
                <AddressError
                  delayAction={false}
                  error="Address has expired and is now unavailable for use."
                  onClick={async () => {
                    await generateDfcUniqueAddress();
                    setIsAddressExpired(false);
                  }}
                />
              ) : (
                <div>
                  {addressGenerationError !== "" ? (
                    <AddressError
                      delayAction
                      error={addressGenerationError}
                      onClick={async () => generateDfcUniqueAddress()}
                    />
                  ) : (
                    dfcUniqueAddress && (
                      <>
                        <SuccessCopy
                          containerClass="m-auto right-0 left-0 top-2"
                          show={showSuccessCopy}
                        />
                        <div className="h-[164px] bg-dark-1000 p-0.5 md:rounded">
                          <QRCode value={dfcUniqueAddress} size={160} />
                        </div>
                        <div className="flex flex-col">
                          <Tooltip
                            content="Click to copy address"
                            containerClass={clsx("relative p-0 mt-1")}
                          >
                            <button
                              type="button"
                              className={clsx(
                                "text-dark-700 text-left break-all focus-visible:outline-none text-center mt-3",
                                "text-xs cursor-pointer hover:underline"
                              )}
                              onClick={() => handleOnCopy(dfcUniqueAddress)}
                            >
                              {dfcUniqueAddress}
                            </button>
                          </Tooltip>
                          {createdBeforeInMSec > 0 && (
                            <div className="text-center">
                              <TimeLimitCounter
                                time={createdBeforeInMSec}
                                onTimeElapsed={() => {
                                  setStorage("dfc-address", null);
                                  setDfcUniqueAddress("");
                                  setIsAddressExpired(true);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center grow text-center md:text-left">
        <span className="font-semibold tracking-wider text-dark-900">
          Transfer funds for release
        </span>
        <p className={clsx("text-sm text-dark-700 mt-1", "md:mt-2")}>
          Use your DeFiChain wallet to send the amount that you want to transfer
          through the Bridge. Make sure you send the correct amount to the
          correct address.
        </p>
        <div className="hidden md:block">
          <FaqSection />
        </div>

        <div className={clsx("hidden", "md:block")}>
          <div className="float-right mt-8">
            {/* Web confirm button */}
            <VerifyButton
              onVerify={handleConfirmClick}
              disabled={
                addressGenerationError !== "" || dfcUniqueAddress === ""
              }
            />
          </div>
        </div>
      </div>

      {/* Mobile FAQ section */}
      <div className="order-2 md:hidden text-center">
        <FaqSection />
      </div>

      {/* Mobile confirm button */}
      <div className={clsx("order-last", "md:hidden")}>
        <div className={clsx("px-6 mt-12", "md:px-0")}>
          <VerifyButton
            onVerify={handleConfirmClick}
            disabled={addressGenerationError !== "" || dfcUniqueAddress === ""}
          />
        </div>
      </div>
    </div>
  );
}
