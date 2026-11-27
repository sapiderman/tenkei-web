// Attendance is a Jakarta activity: every date and time the portal shows is
// Asia/Jakarta, whatever zone the phone or browser is in.
const ZONE = "Asia/Jakarta";

export function formatDate(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(lang, {
    dateStyle: "medium",
    timeZone: ZONE,
  }).format(new Date(iso));
}

export function formatTime(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(lang, {
    timeStyle: "short",
    timeZone: ZONE,
  }).format(new Date(iso));
}
