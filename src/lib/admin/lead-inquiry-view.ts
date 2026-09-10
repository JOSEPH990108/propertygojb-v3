export type LeadInquiryRowInput = {
  inquiryId: string;
  projectDisplayName: string | null;
  projectName: string | null;
  fullName: string | null;
  requesterName: string | null;
  phoneNormalized: string | null;
  requesterPhoneNormalized: string | null;
  email: string | null;
  requesterEmail: string | null;
};

export type LeadInquiryRowView = {
  inquiryId: string;
  projectName: string;
  customerName: string;
  phone: string;
  email: string;
  whatsappHref: string | null;
};

export function getWhatsappHref(phoneNumber: string, projectName: string) {
  const digits = phoneNumber.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hi, I saw your interest in ${projectName}. May I assist you with the brochure, price list, and available units?`,
  )}`;
}

/** Resolves the display fields shared by the admin leads table and mobile card rows. */
export function resolveLeadRowView(
  inquiry: LeadInquiryRowInput,
): LeadInquiryRowView {
  const projectName =
    inquiry.projectDisplayName ?? inquiry.projectName ?? "Project not linked";

  const customerName =
    inquiry.fullName ?? inquiry.requesterName ?? "Unknown customer";

  const phone = inquiry.phoneNormalized ?? inquiry.requesterPhoneNormalized ?? "";

  const email = inquiry.email ?? inquiry.requesterEmail ?? "";

  return {
    inquiryId: inquiry.inquiryId,
    projectName,
    customerName,
    phone,
    email,
    whatsappHref: getWhatsappHref(phone, projectName),
  };
}
