import clsx from "clsx";
import { RiLoader2Line } from "react-icons/ri";

export default function ActionButton({
  label,
  onClick,
  disabled = false,
  isLoading = false,
  variant = "primary",
  needsResponsiveSizing = true,
  testId,
  customStyle,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: "primary" | "secondary";
  needsResponsiveSizing?: boolean;
  testId?: string;
  customStyle?: string;
}) {
  const responsiveSizing = needsResponsiveSizing
    ? "lg:text-xl lg:leading-8 lg:py-4 lg:px-8 xl:px-14"
    : // can pass custom style here if needed
      "";
  const isPrimary = variant === "primary";
  const defaultStyle =
    "text-lg md:px-2.5 lg:text-xl lg:leading-8 lg:px-8 xl:px-14 lg:py-4";
  return (
    <button
      data-testid={testId ?? "action-btn"}
      type="button"
      className={clsx(
        "w-full flex items-center justify-center rounded-[92px] font-bold p-3.5",
        "focus-visible:outline-none disabled:opacity-30",
        "md:px-2.5",
        responsiveSizing,
        isPrimary
          ? "text-dark-100 hover:dark-cta-hover active:dark-cta-pressed bg-dark-1000"
          : "text-dark-1000 hover:dark-btn-hover active:dark-btn-pressed",
        {
          "dark-cta-pressed": isLoading,
          "pointer-events-none": disabled || isLoading,
        },
        customStyle ?? defaultStyle
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
      {isLoading && (
        <RiLoader2Line
          size={24}
          className="inline-block animate-spin text-dark-100 ml-2"
        />
      )}
    </button>
  );
}
