export function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function getBillStatus(bill) {
  if (bill == null) return "normal";
  if (bill.is_paid) return "normal";
  if (!bill.next_due_date) return "normal";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(bill.next_due_date);
  dueDate.setHours(0, 0, 0, 0);

  if (dueDate < today) return "overdue";
  if (dueDate.getTime() === today.getTime()) return "due-today";
  return "normal";
}

/**
 * Converts a date input value (YYYY-MM-DD) to ISO string format
 * using local timezone to avoid off-by-one errors.
 * Sets time to noon local time to avoid timezone boundary issues.
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} ISO 8601 formatted date-time string
 */
export function dateInputToISO(dateString) {
  // Get the browser's timezone offset in minutes
  const timezoneOffset = new Date().getTimezoneOffset();
  
  // Convert offset to hours and minutes
  const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
  const offsetMinutes = Math.abs(timezoneOffset) % 60;
  
  // Format the offset string (e.g., "-07:00" or "+05:30")
  const offsetSign = timezoneOffset > 0 ? "-" : "+";
  const offsetString = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;
  
  // Create ISO string with local timezone offset
  const isoString = `${dateString}T12:00:00.000${offsetString}`;
  
  // Parse and return as ISO string
  return new Date(isoString).toISOString();
}
