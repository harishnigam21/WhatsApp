export function shortTimestamp(
  date: Date | string,
  current: Date = new Date(),
): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const diffInMs = current.getTime() - target.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  const targetDate = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const currentDate = new Date(
    current.getFullYear(),
    current.getMonth(),
    current.getDate(),
  );
  const yesterdayDate = new Date(currentDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  // 1. Within 6 hours (Format: hh:mm AM/PM)
  if (diffInHours >= 0 && diffInHours <= 6) {
    let rawHours = target.getHours();
    const minutes = String(target.getMinutes()).padStart(2, "0");

    // Determine AM or PM suffix
    const ampm = rawHours >= 12 ? "PM" : "AM";

    // Convert 24-hour format down to 12-hour format
    rawHours = rawHours % 12;
    rawHours = rawHours ? rawHours : 12; // The hour '0' should be parsed as '12'

    const hours = String(rawHours).padStart(2, "0");

    return `${hours}:${minutes} ${ampm}`;
  }

  // 2. Same calendar date, but older than 6 hours
  if (targetDate.getTime() === currentDate.getTime()) {
    return "Today";
  }

  // 3. Exactly yesterday
  if (targetDate.getTime() === yesterdayDate.getTime()) {
    return "Yesterday";
  }

  // 4. Older than yesterday (Format: dd/mm/yy)
  const dd = String(target.getDate()).padStart(2, "0");
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  const yy = String(target.getFullYear()).slice(-2);

  return `${dd}/${mm}/${yy}`;
}

export function lastSeen(dateString: Date): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "invalid date";
  }
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const intervals: { unit: Intl.RelativeTimeFormatUnit; amount: number }[] = [
    { unit: "year", amount: 31536000 },
    { unit: "month", amount: 2592000 },
    { unit: "day", amount: 86400 },
    { unit: "hour", amount: 3600 },
    { unit: "minute", amount: 60 },
    { unit: "second", amount: 1 },
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });
  if (diffInSeconds <= 0) {
    return "just now";
  }
  for (const interval of intervals) {
    if (diffInSeconds >= interval.amount) {
      const count = Math.floor(diffInSeconds / interval.amount);
      return `${rtf.format(-count, interval.unit)}`;
    }
  }
  return "just now";
}

export function formatTimeToAmPm(dateString: Date): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date string provided");
  }
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatRelativeDate(inputDateStr: string): string {
  const formatYYYYMMDD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  if (inputDateStr === formatYYYYMMDD(today)) {
    return "Today";
  }
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (inputDateStr === formatYYYYMMDD(yesterday)) {
    return "Yesterday";
  }

  const weekdayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  for (let i = 2; i <= 7; i++) {
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - i);

    if (inputDateStr === formatYYYYMMDD(pastDate)) {
      return weekdayNames[pastDate.getDay()];
    }
  }
  return inputDateStr;
}
