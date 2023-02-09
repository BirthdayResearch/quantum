import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import AlertInfoMessage from "@components/commons/AlertInfoMessage";
import UtilityButton from "@components/commons/UtilityButton";
import UtilitySecondaryButton from "@components/erc-transfer/VerifiedUtilityButton";
import { useLazyVerifyQuery } from "@store/website";
import BigNumber from "bignumber.js";
import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import { getStorageItem } from "@utils/localStorage";
import { UnconfirmedTxnI } from "types";
import { HttpStatusCode } from "axios";
import {
  DISCLAIMER_MESSAGE,
  STORAGE_DFC_ADDR_KEY,
  STORAGE_TXN_KEY,
} from "../../constants";

enum ButtonLabel {
  Validating = "Verifying",
  Validated = "Verified",
  Rejected = "Rejected",
}

enum TitleLabel {
  Validating = "Validating your transaction",
  Validated = "Transaction has been validated",
  Rejected = "Validation failed",
}

enum ContentLabel {
  Validating = "Please wait as your transaction is being verified. This usually takes 10 confirmations from the blockchain. Once verified, you will be redirected to the next step.",
  Validated = "Please wait as we redirect you to the next step.",
  Rejected = "Something went wrong. Please check your network connection and try again.",
}
type RejectedContentType = `Something went wrong${string}`;

export default function StepThreeVerification({
  goToNextStep,
}: {
  goToNextStep: () => void;
}) {
  const { networkEnv } = useNetworkEnvironmentContext();
  const [trigger] = useLazyVerifyQuery();
  const [title, setTitle] = useState<TitleLabel>(TitleLabel.Validating);
  const [content, setContent] = useState<ContentLabel | RejectedContentType>(
    ContentLabel.Rejected
  );
  const [buttonLabel, setButtonLabel] = useState<ButtonLabel>(
    ButtonLabel.Validating
  );

  const dfcAddress = getStorageItem<string>(STORAGE_DFC_ADDR_KEY);
  const txn = getStorageItem<UnconfirmedTxnI>(
    `${networkEnv}.${STORAGE_TXN_KEY}`
  );
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  const triggerVerify = useCallback(() => {
    if (
      isValidating === true &&
      dfcAddress !== null &&
      txn?.amount !== undefined &&
      txn?.selectedTokensA.tokenA.symbol !== undefined
    ) {
      trigger({
        network: networkEnv,
        address: dfcAddress,
        amount: new BigNumber(txn.amount).toFixed(8),
        symbol: txn.selectedTokensA.tokenA.symbol,
      })
        .unwrap()
        .then((data) => {
          if (data?.statusCode !== undefined) {
            setTitle(TitleLabel.Rejected);
            setContent(`Something went wrong (${data.statusCode}).`);
            setValidationSuccess(false);
            setIsValidating(false);
            setButtonLabel(ButtonLabel.Rejected);
            return;
          }

          setTitle(TitleLabel.Validated);
          setContent(ContentLabel.Validated);
          setButtonLabel(ButtonLabel.Validated);
          setValidationSuccess(true);
          goToNextStep();
        })
        .catch(({ data }) => {
          setButtonLabel(ButtonLabel.Rejected);
          setTitle(TitleLabel.Rejected);
          setIsValidating(false);
          setValidationSuccess(false);
          setContent(ContentLabel.Rejected);
          if (data?.statusCode === HttpStatusCode.TooManyRequests) {
            setContent(
              "Something went wrong. Too many requests sent in a given amount of time"
            );
          }
        });
    }
  }, []);

  useEffect(() => {
    triggerVerify();
  }, [isValidating, validationSuccess]);

  return (
    <div
      className={clsx(
        "flex flex-col items-center text-center mt-12 pb-2 justify-between",
        "md:flex-row md:gap-6 md:text-left md:mt-6"
      )}
    >
      <div>
        <span className="font-semibold text-dark-900 tracking-[0.01em] md:tracking-wider">
          {title}
        </span>
        <p className="text-sm text-dark-700 mt-2">{content}</p>
      </div>
      <AlertInfoMessage
        message={DISCLAIMER_MESSAGE}
        containerStyle="px-5 py-4 mt-6 md:hidden"
        textStyle="text-xs"
      />
      <div className={clsx("w-full px-6 pt-12", "md:px-0 md:pt-0 md:w-auto")}>
        {validationSuccess ? (
          <UtilitySecondaryButton label={ButtonLabel.Validated} disabled />
        ) : (
          <UtilityButton
            label={buttonLabel}
            isLoading={isValidating}
            disabled={isValidating || validationSuccess}
            withRefreshIcon={!validationSuccess && !isValidating}
            onClick={() => {
              setTitle(TitleLabel.Validating);
              setContent(ContentLabel.Validating);
              setButtonLabel(ButtonLabel.Validating);
              triggerVerify();
            }}
          />
        )}
      </div>
    </div>
  );
}
