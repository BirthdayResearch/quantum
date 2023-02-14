import { PropsWithChildren } from "react";
import { useRouter } from "next/router";
import { FiAlertCircle } from "react-icons/fi";
import ActionButton from "./ActionButton";
import Modal from "./Modal";

interface Props {
  title: string;
  message: string;
  primaryButtonLabel: string;
  onPrimaryButtonClick?: () => void;
  secondaryActionButton?: boolean;
}

export default function ErrorModal({
  children,
  hasError,
  title,
  message,
  primaryButtonLabel,
  onPrimaryButtonClick,
  secondaryActionButton = false,
}: PropsWithChildren<Props>) {
  const router = useRouter();
  return (
    <Modal isOpen onClose={() => router.reload()}>
      <div className="flex flex-col items-center md:mt-[29px] md:mb-10">
        <FiAlertCircle className="text-8xl text-error ml-1" />
        <div className="mt-8 md:px-[37px] text-center">
          <span className="font-bold text-2xl text-dark-900 mt-12">
            {title}
          </span>
          <div className="mt-2 text-sm md:text-xl leading-5 md:leading-7 text-dark-700">
            {message}
          </div>
        </div>
        <div className="w-full text-center break-words mt-2">{children}</div>
        <span className="flex justify-center pt-8 md:pt-12 w-full">
          <ActionButton
            label={primaryButtonLabel}
            customStyle="md:px-6 text-xg lg:leading-8 lg:py-2 lg:px-8 xl:px-14 w-full md:w-[272px]"
            onClick={onPrimaryButtonClick}
          />
          {secondaryActionButton && (
            <ActionButton
              label="Close"
              variant="secondary"
              customStyle="mt-2 md:px-2.5 lg:text-xl lg:leading-8 lg:py-2 lg:px-8 xl:px-14"
              onClick={() => router.reload()}
            />
          )}
        </span>
      </div>
    </Modal>
  );
}
