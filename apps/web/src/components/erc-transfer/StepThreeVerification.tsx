import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import AlertInfoMessage from "@components/commons/AlertInfoMessage";
import UtilityButton from "@components/commons/UtilityButton";
import UtilitySecondaryButton from "@components/erc-transfer/VerifiedUtilityButton";
import { useLazyVerifyQuery } from "@store/defichain";
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
  ThrottleLimit = "Verification attempt limit reached",
}
type RejectedLabelType = `Something went wrong${string}`;

enum ContentLabel {
  Validating = "Please wait as your transaction is being verified. This usually takes 10 confirmations from the blockchain. Once verified, you will be redirected to the next step.",
  Validated = "Please wait as we redirect you to the next step.",
  Rejected = "Please check our Error guide and try again.",
  ThrottleLimit = "Please wait for a minute and try again.",
}

export default function StepThreeVerification({
  goToNextStep,
}: {
  goToNextStep: () => void;
}) {
  const { networkEnv } = useNetworkEnvironmentContext();
  const [trigger] = useLazyVerifyQuery();
  const [title, setTitle] = useState<TitleLabel | RejectedLabelType>(
    TitleLabel.Validating
  );
  const [content, setContent] = useState<ContentLabel>(ContentLabel.Rejected);
  const [buttonLabel, setButtonLabel] = useState<ButtonLabel>(
    ButtonLabel.Validating
  );

  const dfcAddress = getStorageItem<string>(STORAGE_DFC_ADDR_KEY);
  const txn = getStorageItem<UnconfirmedTxnI>(
    `${networkEnv}.${STORAGE_TXN_KEY}`
  );
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  const triggerVerify = useCallback(async () => {
    if (
      isValidating === true &&
      dfcAddress !== null &&
      txn?.amount !== undefined &&
      txn?.selectedTokensA.tokenA.symbol !== undefined
    ) {
      try {
        const { data } = await trigger({
          address: dfcAddress,
          amount: new BigNumber(txn.amount).toFixed(8),
          symbol: txn.selectedTokensA.tokenA.symbol,
        });

        console.log("trycatch", data);
        if (data?.statusCode !== undefined) {
          console.log({ code: data?.statusCode });
          setContent(ContentLabel.Rejected);
          setTitle(`Something went wrong (Error code ${data.statusCode})`);
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
      } catch ({ data }) {
        setButtonLabel(ButtonLabel.Rejected);
        setIsValidating(false);
        setValidationSuccess(false);

        if (data?.statusCode === HttpStatusCode.TooManyRequests) {
          setTitle(TitleLabel.ThrottleLimit);
          setContent(ContentLabel.ThrottleLimit);
        } else {
          setTitle(TitleLabel.Rejected);
          setContent(ContentLabel.Rejected);
        }
      }
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
