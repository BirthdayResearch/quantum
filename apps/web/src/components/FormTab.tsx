import clsx from "clsx";
import React, { Dispatch, SetStateAction } from "react";
import {
  FormContext,
  useNetworkContext,
} from "../layouts/contexts/NetworkContext";

// queue and instant tab options
export enum TabOptions {
  INSTANT = "Instant",
  QUEUE = "Queue",
}

function Tab({
  label,
  activeTab,
  setActiveTab,
}: {
  label: TabOptions;
  activeTab: TabOptions;
  setActiveTab: Dispatch<SetStateAction<TabOptions>>;
}) {
  const { setTypeOfTransaction } = useNetworkContext();
  function setFormTransactionType(formTabOptions: TabOptions) {
    setTypeOfTransaction(
      TabOptions.INSTANT === formTabOptions
        ? FormContext.INSTANT
        : FormContext.QUEUE
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setActiveTab(label);
        setFormTransactionType(label);
      }}
      className={clsx(
        "py-[17px] relative border-dark-200 w-full",
        label === TabOptions.INSTANT ? "border-r-[0.5px]" : "border-l-[0.5px]"
      )}
    >
      <span
        className={clsx(
          "text-dark-900 font-semibold lg:text-[14px] lg:leading-4 text-xs"
        )}
      >
        {label}
      </span>
      <div
        data-testid={`${activeTab}-tab-highlight`}
        className={clsx("h-px w-full absolute z-10 -bottom-px", {
          "fill-bg-gradient-1": activeTab === label,
        })}
      />
    </button>
  );
}

export function FormTab({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabOptions;
  setActiveTab: Dispatch<SetStateAction<TabOptions>>;
}) {
  return (
    <section
      data-testid="form-tab"
      className={clsx(
        "flex flex-row justify-evenly dark-card-bg-image backdrop-blur-[18px]",
        "border border-dark-200 md:rounded-t-[20px] rounded-t-[15px]",
        "lg:w-full md:w-[calc(100%+2px)] w-full"
      )}
    >
      <Tab
        data-testid="instant-tab"
        label={TabOptions.INSTANT}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <Tab
        data-testid="queue-tab"
        label={TabOptions.QUEUE}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </section>
  );
}
