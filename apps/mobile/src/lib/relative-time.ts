const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Just now", "2 min ago", "Yesterday", "3 days ago", then a plain date. */
export function relativeTime(iso: string): string {
  const then = new Date(iso);
  const diff = Date.now() - then.getTime();

  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(diff / DAY);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
