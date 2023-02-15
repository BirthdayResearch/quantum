import useTimeCounter from "@hooks/useTimeCounter";
import secondsToTime from "@utils/durationHelper";

function getDuration(seconds: number): string {
  const { y, m, d, h, min, s } = secondsToTime(seconds);
  const yDisplay = y > 0 ? `${y}y` : "";
  const mDisplay =
    m > 0 ? ` ${y > 0 ? m.toString().padStart(2, "0") : m} MONTHS` : "";
  const dDisplay =
    d > 0 ? ` ${m > 0 ? d.toString().padStart(2, "0") : d} DAYS` : "";
  const hDisplay =
    h > 0 ? ` ${d > 0 ? h.toString().padStart(2, "0") : h} HOURS` : "";
  const minDisplay =
    min > 0 ? ` ${h > 0 ? min.toString().padStart(2, "0") : min} MINS` : "";
  if (`${yDisplay}${mDisplay}${dDisplay}${hDisplay}${minDisplay}` !== "") {
    return `${yDisplay}${mDisplay}${dDisplay}${hDisplay}${minDisplay} LEFT`;
  }
  const sDisplay =
    s > 0 && minDisplay === "" ? ` ${s.toString().padStart(2, "0")} SECS` : "";
  return `${yDisplay}${mDisplay}${dDisplay}${hDisplay}${minDisplay}${sDisplay} LEFT`;
}

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
        {getDuration(timeRemaining.dividedBy(1000).toNumber())}
      </span>
    </div>
  );
}
