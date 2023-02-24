import ActionButton from "./ActionButton";
import Modal from "./Modal";

export default function UtilityModal({
  show,
  title,
  message,
  primaryButtonLabel,
  secondaryButtonLabel,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
}: {
  show: boolean;
  title: string;
  message: string;
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  onPrimaryButtonClick: () => void;
  onSecondaryButtonClick: () => void;
}) {
  return (
    <Modal isOpen={show}>
      <div className="flex flex-col items-center mt-6 mb-14">
        <span className="font-bold text-lg lg:text-2xl text-dark-900">
          {title}
        </span>
        <div className="text-sm md:text-lg leading-5 md:leading-6 w-full text-dark-900 text-center mt-2 px-[29px]">
          {message}
        </div>
        <span className="mt-[76px]">
          <ActionButton
            label={primaryButtonLabel}
            customStyle="bg-error md:px-6 text-xg lg:leading-8 lg:py-2 lg:px-8 xl:px-14"
            onClick={onPrimaryButtonClick}
          />
          <ActionButton
            label={secondaryButtonLabel}
            variant="secondary"
            customStyle="mt-2 md:px-2.5 lg:text-xl lg:leading-8 lg:py-2 lg:px-8 xl:px-14 border-[0.5px] border-dark-500"
            onClick={onSecondaryButtonClick}
          />
        </span>
      </div>
    </Modal>
  );
}
