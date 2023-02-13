import ErrorModal from "@components/commons/ErrorModal";
import IconTooltip from "@components/commons/IconTooltip";

export default function DailyLimitErrorModal({ show }: { show: boolean }) {
  return (
    <ErrorModal
      title="Daily limit has been reached"
      message="Your transaction cannot be processed now and funds will be refunded back to the sending address. Please try your transaction again when the daily limit is reset tomorrow."
      hasError={show}
      primaryButtonLabel="Close"
      // onPrimaryButtonClick={() => ()}
    >
      <div className="flex items-center justify-center">
        <div className="mr-2">
          <IconTooltip
            title="placeholder title"
            content="placeholder content"
          />
        </div>
        <span className="text-sm text-dark-900 leading-5 tracking-[0.02em]">
          Learn more about Daily Limits
        </span>
      </div>
      <div className="mt-12 py-6 px-4 md:px-32 dark-bg-card-section border border-dark-card-stroke rounded-lg leading-5">
        <p className="text-sm text-dark-900">
          Track refund activity in this address:
        </p>
        <div className="text-valid mt-1">
          13fb618874ddde99ee975c25902bbae27d47557dc86ed1dde71efc45fa262072
        </div>
      </div>
    </ErrorModal>
  );
}
