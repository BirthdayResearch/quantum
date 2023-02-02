import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useState, useEffect, useRef } from "react";
import getDuration from "@utils/durationHelper";
import ProgressBar from "@components/commons/ProgressBar";
import { DFC_TO_ERC_TIME_LIMIT } from "../../constants";

export default function TimeLimitCounter({
  onTimeElapsed,
}: {
  onTimeElapsed: () => void;
}) {
  const [timeRemaining, setTimeRemaining] = useState<BigNumber>(
    new BigNumber(DFC_TO_ERC_TIME_LIMIT)
  );
  const intervalRef = useRef<any>(null);

  const decreaseTimeRemaining = () => setTimeRemaining((time) => time.minus(1));
  useEffect(() => {
    intervalRef.current = setInterval(decreaseTimeRemaining, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (timeRemaining.lte(0)) {
      setTimeRemaining(new BigNumber(0));
      clearInterval(intervalRef.current);
      onTimeElapsed();
    }
  }, [timeRemaining]);

  const timeLimitPercentage = timeRemaining
    .dividedBy(DFC_TO_ERC_TIME_LIMIT)
    .multipliedBy(100);

  const getFillColor = () => {
    let color = "bg-dark-grdient-3";
    let textColor = "text-dark-gradient-3";
    if (timeLimitPercentage.lt(16.67)) {
      /* less than 5mins */
      color = "bg-error";
      textColor = "text-error";
    } else if (timeLimitPercentage.lt(33.33)) {
      /* less than 10mins */
      color = "bg-warning";
      textColor = "text-warning";
    }
    return { color, textColor };
  };

  return (
    <div className={clsx("flex-1 items-center gap-1", "md:mt-4 md:gap-3")}>
      <div className="w-full">
        <ProgressBar
          progressPercentage={timeLimitPercentage}
          fillColor={getFillColor().color}
        />
      </div>
      <span
        className={clsx(
          "text-xs md:text-sm font-semibold tracking-wide items-center flex justify-center",
          getFillColor().textColor
        )}
      >
        {getDuration(timeRemaining.toNumber())}
      </span>
    </div>
  );
}
