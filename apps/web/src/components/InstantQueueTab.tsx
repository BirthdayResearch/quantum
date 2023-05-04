import clsx from "clsx";
import React, { Dispatch, SetStateAction } from "react";

export function InstantQueueTab({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabOptions;
  setActiveTab: Dispatch<SetStateAction<TabOptions>>;
}) {
  return (
    <section className={clsx("flex flex-row justify-evenly")}>
      <Tab
        label={TabOptions.INSTANT}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <Tab
        label={TabOptions.QUEUE}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </section>
  );
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
  return (
    <button
      onClick={() => {
        setActiveTab(label);
      }}
      className="w-full"
    >
      <div
        className={clsx(
          "py-[17px] bg-dark-100 border border-dark-200 lg:w-full md:w-[calc(100%+2px)] w-full relative",
          label === TabOptions.INSTANT
            ? "md:rounded-tl-[20px] rounded-tl-[15px] border-r-[0.5px]"
            : "md:rounded-tr-[20px] rounded-tr-[15px] border-l-[0.5px]"
        )}
      >
        <span
          className={clsx("text-dark-900 font-semibold text-[14px] leading-4")}
        >
          {label}
        </span>
        <div
          className={clsx(
            "h-[1px] lg:w-full md:w-[calc(100%+2px)] w-full absolute z-10 -bottom-[1px]",
            { "fill-bg-gradient-1": activeTab === label }
          )}
        />
      </div>
    </button>
  );
}

export enum TabOptions {
  INSTANT = "Instant",
  QUEUE = "Queue",
}
