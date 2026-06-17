export function normalizeLocalPhoneNumber(value: string) {
  return value.replace(/\D/g, "").replace(/^0+/, "");
}

export function buildPhoneNumber(countryCode: string, localNumber: string) {
  return `${countryCode}${normalizeLocalPhoneNumber(localNumber)}`;
}

export function createPhoneTempEmail(phoneNumber: string) {
  const normalized = phoneNumber.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return `${normalized}@phone.propertygojb.local`;
}
