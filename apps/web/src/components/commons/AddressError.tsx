import { FiAlertCircle } from "react-icons/fi";
import UtilityButton from "@components/commons/UtilityButton";

export default function AddressError({
  onClick,
  error,
}: {
  onClick: () => void;
  error: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center">
      <FiAlertCircle size={48} className="text-dark-1000" />
      <span className="text-center text-xs text-dark-900 mt-6 mb-4">
        {error}
      </span>
      <div className="w-full px-6 md:w-auto md:px-0 md:pb-2">
        <UtilityButton
          label="Generate again"
          variant="secondary"
          onClick={onClick}
        />
      </div>
    </div>
  );
}
