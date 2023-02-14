import clsx from "clsx";
import { useState } from "react";
import { ProgressStepI, TransferData } from "types";
import useResponsive from "@hooks/useResponsive";
import ProgressStepIndicator from "@components/commons/ProgressStepIndicator";
import ProgressStepIndicatorMobile from "@components/commons/ProgressStepIndicatorMobile";
import StepOneInitiate from "./StepOneInitiate";
import StepTwoSendConfirmation from "./StepTwoSendConfirmation";
import StepThreeVerification from "./StepThreeVerification";
import StepLastClaim from "./StepLastClaim";

const DfcToErcTransferSteps: ProgressStepI[] = [
  { step: 1, label: "Initiate" },
  { step: 2, label: "Transact" },
  { step: 3, label: "Validate" },
  { step: 4, label: "Claim" },
];

export default function DeFiChainToERC20Transfer({
  data,
}: {
  data: TransferData;
}) {
  const [activeStep, setActiveStep] = useState(1);
  const { isMobile } = useResponsive();
  // TODO: check if transaction validated from api
  const transactionValidated = true;

  const handleNextStep = () => {
    setActiveStep(activeStep + 1);
    if (activeStep >= 3 && transactionValidated) {
      setActiveStep(activeStep + 2);
    }
  };

  return (
    <div
      className={clsx(
        "rounded-md mt-6 pt-4",
        "md:mt-8 md:dark-bg-card-section md:pb-4 md:px-6"
      )}
    >
      <div className="md:h-[60px]">
        {isMobile ? (
          <ProgressStepIndicatorMobile
            steps={DfcToErcTransferSteps}
            activeStep={activeStep}
          />
        ) : (
          <ProgressStepIndicator
            steps={DfcToErcTransferSteps}
            activeStep={activeStep}
          />
        )}
      </div>
      {activeStep === 1 && <StepOneInitiate goToNextStep={handleNextStep} />}
      {activeStep === 2 && (
        <StepTwoSendConfirmation goToNextStep={handleNextStep} />
      )}
      {activeStep === 3 && (
        <StepThreeVerification goToNextStep={handleNextStep} />
      )}
      {activeStep >= 4 && (
        <StepLastClaim
          data={data}
          // TODO: Pass signature and nonce from Verification step here
          signedClaim={{ signature: "", nonce: 0 }}
        />
      )}
    </div>
  );
}
