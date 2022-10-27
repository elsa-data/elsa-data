import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import dayjs from "dayjs";

dayjs.extend(relativeTime);
dayjs.extend(duration);

export const formatTime = (time?: string): string => {
  if (!duration) {
    return "";
  }

  return dayjs(time).fromNow();
};

export const formatDuration = (duration?: string): string => {
  if (!duration) {
    return "";
  }

  return dayjs.duration(duration).humanize();
};
