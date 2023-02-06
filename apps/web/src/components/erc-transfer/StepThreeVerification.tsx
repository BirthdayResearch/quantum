import clsx from "clsx";
import { useEffect, useState } from "react";
import AlertInfoMessage from "@components/commons/AlertInfoMessage";
import UtilityButton from "@components/commons/UtilityButton";
import UtilitySecondaryButton from "@components/erc-transfer/VerifiedUtilityButton";
import { DISCLAIMER_MESSAGE } from "../../constants";

export default function StepThreeVerification({
  goToNextStep,
}: {
  goToNextStep: () => void;
}) {
  const VALIDATING_TITLE = "Validating your transaction";
  const VALIDATED_TITLE = "Transaction has been validated";
  const REJECTED_TITLE = "Validation failed";

  const VALIDATING_CONTENT =
    "Please wait as your transaction is being verified. This usually takes 10 confirmations from the blockchain. Once verified, you will be redirected to the next step.";
  const VALIDATED_CONTENT = "Please wait as we redirect you to the next step.";
  const REJECTED_CONTENT =
    "Something went wrong. Please check your network connection and try again.";

  const VALIDATING_BUTTON = "Verifying";
  const VALIDATED_BUTTON = "Verified";
  const REJECTED_BUTTON = "Try again";

  const [title, setTitle] = useState(VALIDATING_TITLE);
  const [content, setContent] = useState(VALIDATING_CONTENT);
  const [buttonLabel, setButtonLabel] = useState(VALIDATING_BUTTON);

  // TODO use api response
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // TODO: Replace with real loading time from api
    setTimeout(() => {
      setValidationSuccess(true);
      setIsValidating(false);
    }, 3000);
  }, [isValidating, validationSuccess]);

  useEffect(() => {
    if (validationSuccess && !isValidating) {
      setTitle(VALIDATED_TITLE);
      setContent(VALIDATED_CONTENT);
    } else if (!validationSuccess && !isValidating) {
      setTitle(REJECTED_TITLE);
      setContent(REJECTED_CONTENT);
      setButtonLabel(REJECTED_BUTTON);
    } else {
      setTitle(VALIDATING_TITLE);
      setContent(VALIDATING_CONTENT);
      setButtonLabel(VALIDATING_BUTTON);
    }
  }, [validationSuccess, isValidating]);

  // TODO: might need to remove this once api is up
  useEffect(() => {
    // go to next step once validated after some time
    setTimeout(() => {
      if (validationSuccess && !isValidating) {
        goToNextStep();
      }
    }, 3000);
  });

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
          <UtilitySecondaryButton label={VALIDATED_BUTTON} disabled />
        ) : (
          <UtilityButton
            label={buttonLabel}
            isLoading={isValidating}
            disabled={isValidating || validationSuccess}
            withRefreshIcon={!validationSuccess && !isValidating}
            // to retry validation
            onClick={() => {
              // TODO attempt to validate via api
              setValidationSuccess(false);
              setIsValidating(true);

              setTitle(VALIDATING_TITLE);
              setContent(VALIDATING_CONTENT);
              setButtonLabel(VALIDATING_BUTTON);
            }}
          />
        )}
      </div>
    </div>
  );
}
