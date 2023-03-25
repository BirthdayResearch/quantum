import { FiAlertCircle } from "react-icons/fi";
import ActionButton from "./ActionButton";
import Modal from "./Modal";

export default function ErrorModal({
  title,
  message,
  primaryButtonLabel,
  onPrimaryButtonClick,
  onClose,
  testId,
}: {
  title: string;
  message: string;
  primaryButtonLabel: string;
  onPrimaryButtonClick?: () => void;
  onClose: () => void;
  testId?: string;
}): JSX.Element {
  return (
    <Modal isOpen onClose={onClose} testId={`${testId}-err`}>
      <div className="flex flex-col items-center mt-6 mb-14">
        <FiAlertCircle className="text-8xl text-error ml-1" />
        <span
          className="font-bold text-2xl text-dark-900 mt-12"
          data-testid={`${testId}-err-title`}
        >
          {title}
        </span>
        <div
          className="w-full text-dark-900 text-center break-word mt-2 px-[29px]"
          data-testid={`${testId}-err-msg`}
        >
          {message}
        </div>
        <span className="pt-12">
          <ActionButton
            label={primaryButtonLabel}
            customStyle="md:px-6 text-xg lg:!py-3 lg:px-8 xl:px-14"
            onClick={onPrimaryButtonClick}
            testId={`${testId}-err-action-btn`}
          />
          <ActionButton
            label="Close"
            variant="secondary"
            customStyle="mt-2 md:px-2.5 lg:text-xl lg:!py-3 lg:px-8 xl:px-14"
            onClick={onClose}
            testId={`${testId}-err-close-btn`}
          />
        </span>
      </div>
    </Modal>
  );
}
