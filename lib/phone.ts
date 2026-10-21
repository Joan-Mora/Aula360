export function digits(value: string) {
  return value.replace(/\D/g, "");
}

export function phonesMatch(left: string, right: string) {
  const a = digits(left);
  const b = digits(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const tail = 10;
  return a.length >= tail && b.length >= tail && a.slice(-tail) === b.slice(-tail);
}

export function whatsappTo(value: string) {
  const phone = digits(value);
  if (phone.length === 10) return `57${phone}`;
  return phone;
}
