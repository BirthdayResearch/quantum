import { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import { useNetworkContext } from "@contexts/NetworkContext";
import BigNumber from "bignumber.js";
import useResponsive from "@hooks/useResponsive";
import NumericFormat from "./commons/NumericFormat";
import ProgressBar from "./commons/ProgressBar";
import DailyLimitHeader from "./DailyLimitHeader";
import LimitMessage from "./DailyLimitMessage";

enum LimitMessageType {
  AtLimit = "Limit is almost reached. Proceed with caution.",
  LimitReached = "Max limit reached",
}

export default function DailyLimit() {
  const { selectedTokensB } = useNetworkContext();
  const { isMobile } = useResponsive();
  const [limitMessage, setLimitMessageState] = useState<string | null>(null);

  const DAILY_CAP = {
    dailyLimit: 25,
    reachedLimit: 22,
  };

  const limitPercentage = useMemo(
    () =>
      new BigNumber(DAILY_CAP.reachedLimit)
        .dividedBy(DAILY_CAP.dailyLimit)
        .multipliedBy(100)
        .decimalPlaces(2),
    [DAILY_CAP.dailyLimit, DAILY_CAP.reachedLimit]
  );

  const getFillColor = () => {
    let color = "bg-error";
    if (limitPercentage.lte(50)) {
      color = "bg-dark-grdient-3";
    } else if (limitPercentage.lte(75)) {
      color = "bg-warning";
    }
    return color;
  };

  const getTextColor = () => {
    let color = "text-error";
    if (limitPercentage.lte(50)) {
      color = "text-dark-grdient-3";
    } else if (limitPercentage.lte(99)) {
      color = "text-warning";
    }
    return color;
  };

  function getLimitMessage() {
    if (limitPercentage.gte(50) && limitPercentage.lte(99)) {
      return LimitMessageType.AtLimit;
    }
    if (limitPercentage.isEqualTo(100)) {
      return LimitMessageType.LimitReached;
    }
    return null;
  }

  useEffect(() => {
    setLimitMessageState(getLimitMessage());
  }, [limitPercentage, limitMessage]);

  const AtLimit = limitMessage === LimitMessageType.AtLimit;
  const DailyLimitReached = limitMessage === LimitMessageType.LimitReached;

  return (
    <div className="flex flex-wrap justify-between items-baseline md:block">
      <div className="w-full order-last mt-2 md:mt-0">
        <ProgressBar
          progressPercentage={limitPercentage}
          fillColor={getFillColor()}
        />
      </div>
      <div className="block md:hidden ">
        <DailyLimitHeader />
      </div>

      <div
        className={clsx(
          "md:mt-2 flex items-center text-xs md:text-sm lg:text-base",
          { "justify-between": DailyLimitReached }
        )}
      >
        <NumericFormat
          className={clsx(
            {
              "self-start text-left text-dark-700": DailyLimitReached,
            },
            { "text-dark-900": !DailyLimitReached }
          )}
          value={DAILY_CAP.dailyLimit}
          decimalScale={DailyLimitReached ? 0 : 3}
          thousandSeparator
          suffix={` ${selectedTokensB.tokenA.name}`}
        />
        {!DailyLimitReached && (
          <span className="hidden md:block text-dark-700 ml-1">
            {`(${limitPercentage}%)`}
          </span>
        )}

        {DailyLimitReached && !isMobile ? (
          <div className="block">
            <LimitMessage color={getTextColor()} message={limitMessage} />
          </div>
        ) : (
          <NumericFormat
            className="self-end text-right text-dark-700 grow ml-0.5"
            value={DAILY_CAP.dailyLimit}
            decimalScale={0}
            thousandSeparator
            prefix="/"
            suffix={` ${selectedTokensB.tokenA.name}`}
          />
        )}
      </div>
      {(AtLimit || (DailyLimitReached && isMobile)) && (
        <div className="order-last inline-flex mt-2 md:mt-5 lg:mt-6">
          <LimitMessage color={getTextColor()} message={limitMessage} />
        </div>
      )}
    </div>
  );
}
