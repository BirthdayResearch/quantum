import clsx from "clsx";
import Image from "next/image";

export default function SearchQueuedTransactionButton({
  onClick,
  hasQueuedTransaction,
  customImageSize,
  customStyle,
}: {
  onClick: () => void;
  hasQueuedTransaction: boolean;
  customImageSize?: string;
  customStyle?: string;
}) {
  return (
    <button
      className={clsx(
        "relative mr-2 p-3 rounded-full border-[1px] border-dark-300/50 bg-dark-00",
        customStyle
      )}
      onClick={onClick}
      type="button"
    >
      <div
        className={clsx("relative", customImageSize ?? "md:w-6 md:h-6 w-4 h-4")}
      >
        <Image
          fill
          data-testid="search-queued-transaction"
          src="/search-transaction.svg"
          alt="Search Queued Transaction"
        />
      </div>
      {hasQueuedTransaction && (
        <div className="bg-gradient-3 md:w-2.5 md:h-2.5 w-[7.11px] h-[7.11px] md:top-0.5 md:right-0.5 top-[1.78px] right-[1.78px] absolute rounded-full" />
      )}
    </button>
  );
}
