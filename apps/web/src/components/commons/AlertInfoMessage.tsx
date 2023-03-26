import clsx from "clsx";
import { FiAlertTriangle } from "react-icons/fi";
import { PropsWithChildren } from "react";

export default function AlertInfoMessage({
  containerStyle,
  children,
  testId,
}: PropsWithChildren<{
  containerStyle?: string;
  testId?: string;
}>) {
  return (
    <div
      className={clsx(
        "flex items-center border border-warning rounded-lg",
        containerStyle
      )}
      data-testid={`${testId}-alert-container`}
    >
      <FiAlertTriangle
        size={24}
        className="shrink-0 text-warning"
        data-testid={`${testId}-alert-icon`}
      />
      {children}
    </div>
  );
}
