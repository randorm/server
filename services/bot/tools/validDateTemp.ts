export function isValidDate(dateString: string) {
  const regex = /^\d{4}\-\d{2}\-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const parts = dateString.split("-");
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[0], 10);

  if (year < 1000 || year > 3000 || month === 0 || month > 12) return false;

  const maxDay = new Date(year, month, 0).getDate();
  if (day > maxDay) return false;

  return true;
}
