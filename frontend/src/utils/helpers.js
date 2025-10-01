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
