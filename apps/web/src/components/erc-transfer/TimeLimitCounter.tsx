import useTimeCounter from "@hooks/useTimeCounter";
import getDuration from "@utils/durationHelper";

export default function TimeLimitCounter({
  time,
  onTimeElapsed,
}: {
  time: number;
  onTimeElapsed: () => void;
}) {
  const { timeRemaining } = useTimeCounter(time, onTimeElapsed);
  return (
    <div className="mt-4 text-center">
      <span className="text-dark-gradient-3 text-2xs font-bold">
        {getDuration(timeRemaining.dividedBy(1000).toNumber())} left
      </span>
    </div>
  );
}
