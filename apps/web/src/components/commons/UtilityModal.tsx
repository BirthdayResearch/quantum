import ActionButton from "./ActionButton";
import Modal from "./Modal";

export interface ModalConfigType {
  title: string;
  message: string;
  primaryButtonLabel: string;
  onPrimaryButtonClick: () => void;
  secondaryButtonLabel: string;
  onSecondaryButtonClick: () => void;
  testId?: string;
}

export default function UtilityModal({
  title,
  message,
  primaryButtonLabel,
  secondaryButtonLabel,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  testId,
}: ModalConfigType) {
  return (
    <Modal isOpen testId="utility">
      <div className="flex flex-col items-center mt-6 mb-14">
        <span
          className="font-bold text-lg lg:text-2xl text-dark-900 text-center"
          data-testid="utility-title"
        >
          {title}
        </span>
        <div
          className="text-sm md:text-lg leading-5 md:leading-6 w-full text-dark-900 text-center mt-2 px-[29px]"
          data-testid="utility-msg"
        >
          {message}
        </div>
        <span className="mt-[76px]">
          <ActionButton
            label={primaryButtonLabel}
            customStyle="bg-error md:px-6 text-xg lg:!py-3 lg:px-8 xl:px-14"
            onClick={onPrimaryButtonClick}
            data-testid="utility-primary-btn"
          />
          <ActionButton
            label={secondaryButtonLabel}
            variant="secondary"
            customStyle="mt-2 md:px-2.5 lg:!py-3 lg:px-8 xl:px-14 border-[0.5px] border-dark-500"
            onClick={onSecondaryButtonClick}
            data-testid="utility-secondary-btn"
          />
        </span>
      </div>
    </Modal>
  );
}
