import { normalizeLocalPhoneNumber } from "@/lib/auth/phone";
import { publicSiteConfig } from "@/config/public-site";

export const PUBLIC_SITE_NAME = publicSiteConfig.name;
export const PUBLIC_SITE_TAGLINE = publicSiteConfig.description;
export const PUBLIC_DEFAULT_COUNTRY_CODE = "+60";
export const PUBLIC_DEFAULT_WHATSAPP_NUMBER = publicSiteConfig.contact.whatsappNumber;

export const PUBLIC_COUNTRY_CODE_OPTIONS = [
  { value: "+60", label: "+60 Malaysia" },
  { value: "+65", label: "+65 Singapore" },
  { value: "+62", label: "+62 Indonesia" },
  { value: "+66", label: "+66 Thailand" },
  { value: "+91", label: "+91 India" },
];

export const PUBLIC_CONTACT_METHOD_OPTIONS = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "CALL", label: "Call me" },
  { value: "EMAIL", label: "Email" },
];

export function getPublicWhatsAppNumber() {
  const rawValue =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    process.env.PUBLIC_WHATSAPP_NUMBER ??
    PUBLIC_DEFAULT_WHATSAPP_NUMBER;

  const digits = rawValue.replace(/\D/g, "");

  if (!digits) {
    return PUBLIC_DEFAULT_WHATSAPP_NUMBER;
  }

  if (digits.startsWith("60")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `60${digits.slice(1)}`;
  }

  return digits;
}

export function getPublicWhatsAppHref(message: string) {
  return `https://wa.me/${getPublicWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
}

export function buildPublicPhoneNumber(countryCode: string, localNumber: string) {
  const countryDigits = countryCode.replace(/\D/g, "");
  const localDigits = normalizeLocalPhoneNumber(localNumber);

  if (!countryDigits || !localDigits) {
    return "";
  }

  return `+${countryDigits}${localDigits}`;
}

export function buildProjectEnquiryMessage(
  projectName: string,
  action = "Please share the latest brochure, price list, and available units.",
) {
  return `Hi, I am interested in ${projectName}. ${action}`;
}
