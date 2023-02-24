import clsx from "clsx";
import { useState } from "react";
import {
  ProgressStepI,
  AddressDetails,
  TransferData,
  SignedClaim,
} from "types";
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
  addressDetail,
}: {
  data: TransferData;
  addressDetail?: AddressDetails;
}) {
  const [activeStep, setActiveStep] = useState(1);
  const { isMobile } = useResponsive();

  const [refundAddress, setRefundAddress] = useState<string>(
    addressDetail?.refundAddress ?? ""
  );

  const [signedClaim, setSignedClaim] = useState<SignedClaim>();

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
      {activeStep === 1 && (
        <StepOneInitiate
          refundAddress={refundAddress}
          setRefundAddress={setRefundAddress}
          // Note: Once the DFC address is generated, a refundAddress is already tied to it.
          isReadOnly={addressDetail?.refundAddress !== undefined}
          goToNextStep={() => {
            handleNextStep();
          }}
        />
      )}
      {activeStep === 2 && (
        <StepTwoSendConfirmation
          refundAddress={refundAddress}
          addressDetail={addressDetail}
          goToNextStep={handleNextStep}
        />
      )}
      {activeStep === 3 && (
        <StepThreeVerification
          goToNextStep={handleNextStep}
          onSuccess={(claim) => setSignedClaim(claim)}
        />
      )}
      {activeStep >= 4 && signedClaim && (
        <StepLastClaim data={data} signedClaim={signedClaim} />
      )}
    </div>
  );
}
