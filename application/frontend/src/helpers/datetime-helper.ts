import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import dayjs from "dayjs";

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(LocalizedFormat);

export type Millisecond = number;

export const differenceFromNow = (time?: string): Millisecond => {
  if (!duration) {
    return NaN;
  }

  return dayjs().diff(dayjs(time), "millisecond");
};

export const formatFromNowTime = (time?: string): string => {
  if (!duration) {
    return "";
  }

  return dayjs(time).fromNow();
};

export const formatLocalDateTime = (dateTime?: string): string => {
  if (!duration) {
    return "";
  }

  return dayjs(dateTime).format("lll");
};

export const formatDuration = (duration?: string): string => {
  if (!duration) {
    return "";
  }

  return dayjs.duration(duration).humanize();
};
