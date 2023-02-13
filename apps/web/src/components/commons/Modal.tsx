import clsx from "clsx";
import { PropsWithChildren } from "react";
import { FiXCircle } from "react-icons/fi";
import { Dialog } from "@headlessui/react";
import useResponsive from "@hooks/useResponsive";

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
}

export default function Modal({
  children,
  isOpen,
  title,
  onClose,
}: PropsWithChildren<Props>) {
  const { isMobile } = useResponsive();

  return (
    <Dialog
      as="div"
      className="relative z-10"
      open={isOpen}
      onClose={onClose ?? (() => {})}
    >
      <Dialog.Panel className="transform transition-all fixed inset-0 px-6 bg-dark-100 bg-opacity-70 backdrop-blur-[18px] overflow-auto">
        <div
          className={clsx(
            "relative w-full dark-card-bg-image rounded-xl border border-dark-card-stroke backdrop-blur-[18px] m-auto my-10 md:my-0 px-6 pt-8 pb-12 md:p-6",
            "md:w-[640px] top-[calc(50%+30px)] -translate-y-1/2  overflow-auto"
          )}
        >
          {title !== undefined && (
            <Dialog.Title
              as="div"
              className="flex items-center justify-between mb-8 md:mb-6"
            >
              <h3
                className={clsx(
                  "text-2xl font-bold text-dark-900",
                  "md:font-semibold md:leading-9 md:tracking-wide"
                )}
              >
                {title}
              </h3>
              {onClose && !isMobile && (
                <FiXCircle
                  size={28}
                  className="text-dark-900 cursor-pointer hover:opacity-70 text-2xl md:text-[28px]"
                  onClick={onClose}
                />
              )}
            </Dialog.Title>
          )}
          {children}
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
