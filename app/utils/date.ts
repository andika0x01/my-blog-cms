import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/id";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");

export function formatDate(dateString: string, formatStr: string = "DD MMMM YYYY"): string {
  return dayjs.utc(dateString).tz("Asia/Jakarta").format(formatStr);
}
