import { difference } from "../../../deps.ts";
import { DateTimeScalar } from "../../../services/graphql/scalar/datetime.ts";

export function isValidDate(dateString: string) {
  const regex = /^\d{2}\.\d{2}\.\d{4}$/;
  if (!regex.test(dateString)) return false;

  const parts = dateString.split("-");
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (year < 1000 || year > 3000 || month === 0 || month > 12) return false;

  const maxDay = new Date(year, month, 0).getDate();
  if (day > maxDay) return false;
  const birthday = DateTimeScalar.parseValue(
    year + "-" + month + "-" + day + " 00:00:00",
  );
  const { years } = difference(birthday, new Date(), { units: ["years"] });
  if (!years || years < 4 || years > 120) {
    return false;
  }

  return true;
}
