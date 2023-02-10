import IconTooltip from "./commons/IconTooltip";
import { DAILY_LIMIT_INFO } from "../constants";

export default function DailyLimitHeader() {
  return (
    <div className="flex items-center">
      <span className="text-xs leading-4 md:text-base md:leading-5 lg:text-lg lg:leading-6 font-semibold tracking-wide text-dark-700 md:text-dark-900">
        Daily limit
      </span>
      <div className="ml-2">
        <IconTooltip
          title={DAILY_LIMIT_INFO.title}
          content={DAILY_LIMIT_INFO.content}
        />
      </div>
    </div>
  );
}
