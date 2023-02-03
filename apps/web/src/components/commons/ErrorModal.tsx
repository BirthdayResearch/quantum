import { useRouter } from "next/router";
import { FiAlertCircle } from "react-icons/fi";
import ActionButton from "./ActionButton";
import Modal from "./Modal";

export default function ErrorModal({
  hasError,
  title,
  message,
  primaryButtonLabel,
  secondaryButtonLabel,
}: {
  hasError: boolean;
  title: string;
  message: string;
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
}): JSX.Element {
  const router = useRouter();
  return (
    <Modal isOpen={hasError} onClose={() => router.reload()}>
      <div className="flex flex-col items-center mt-6 mb-14">
        <FiAlertCircle className="text-8xl text-error ml-1" />
        <span className="font-bold text-2xl text-dark-900 mt-12">{title}</span>
        <span className="text-dark-900 mt-2 text-center px-[29px]">
          {message}
        </span>
        <span className="pt-12">
          <ActionButton
            label={primaryButtonLabel}
            customStyle="md:px-6 text-xg lg:leading-8 lg:py-2 lg:px-8 xl:px-14"
          />
          <ActionButton
            label={secondaryButtonLabel}
            variant="secondary"
            customStyle="mt-2 md:px-2.5 lg:text-xl lg:leading-8 lg:py-2 lg:px-8 xl:px-14"
          />
        </span>
      </div>
    </Modal>
  );
}
