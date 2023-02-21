import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import AlertInfoMessage from "@components/commons/AlertInfoMessage";
import UtilityButton from "@components/commons/UtilityButton";
import UtilitySecondaryButton from "@components/erc-transfer/VerifiedUtilityButton";
import { useLazyVerifyQuery } from "@store/index";
import BigNumber from "bignumber.js";
import Logging from "@api/logging";
import { getStorageItem } from "@utils/localStorage";
import { SignedClaim, UnconfirmedTxnI } from "types";
import { HttpStatusCode } from "axios";
import { useContractContext } from "@contexts/ContractContext";
import useBridgeFormStorageKeys from "@hooks/useBridgeFormStorageKeys";
import { DISCLAIMER_MESSAGE } from "../../constants";

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
  ThrottleLimit = "Please wait for a minute and try again.",
}

export default function StepThreeVerification({
  goToNextStep,
  onSuccess,
}: {
  goToNextStep: () => void;
  onSuccess: (claim: SignedClaim) => void;
}) {
  const { Erc20Tokens } = useContractContext();
  const [trigger] = useLazyVerifyQuery();
  const [title, setTitle] = useState<TitleLabel | RejectedLabelType>(
    TitleLabel.Validating
  );
  const contentLabelRejected = (
    <span>
      <span>Please check our {/* TODO insert link once available */}</span>
      <button type="button" onClick={() => {}} className="underline">
        Error guide
      </button>
      <span> and try again</span>
    </span>
  );
  const [content, setContent] = useState<ContentLabel | JSX.Element>(
    contentLabelRejected
  );
  const [buttonLabel, setButtonLabel] = useState<ButtonLabel>(
    ButtonLabel.Validating
  );

  const { TXN_KEY, DFC_ADDR_KEY } = useBridgeFormStorageKeys();
  const dfcAddress = getStorageItem<string>(DFC_ADDR_KEY);
  const txn = getStorageItem<UnconfirmedTxnI>(TXN_KEY);
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
        const response = await trigger({
          address: dfcAddress,
          ethReceiverAddress: txn.toAddress,
          tokenAddress: Erc20Tokens[txn.selectedTokensB.tokenA.name].address,
          amount: new BigNumber(txn.amount).toFixed(8),
          symbol: txn.selectedTokensA.tokenA.symbol,
        }).unwrap();

        if (response.statusCode !== undefined) {
          Logging.info(`Returned statusCode: ${response.statusCode}`);
          setContent(contentLabelRejected);
          setTitle(`Something went wrong (Error code ${response.statusCode})`);
          setValidationSuccess(false);
          setIsValidating(false);
          setButtonLabel(ButtonLabel.Rejected);
          return;
        }

        setTitle(TitleLabel.Validated);
        setContent(ContentLabel.Validated);
        setButtonLabel(ButtonLabel.Validated);
        setValidationSuccess(true);
        onSuccess(response.data);
        goToNextStep();
      } catch (e) {
        setButtonLabel(ButtonLabel.Rejected);
        setIsValidating(false);
        setValidationSuccess(false);

        if (e.data?.statusCode === HttpStatusCode.TooManyRequests) {
          setTitle(TitleLabel.ThrottleLimit);
          setContent(ContentLabel.ThrottleLimit);
        } else {
          setTitle(TitleLabel.Rejected);
          setContent(contentLabelRejected);
        }
        Logging.error(e);
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
