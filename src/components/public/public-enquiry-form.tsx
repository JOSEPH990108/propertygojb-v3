"use client";

import { FormEvent, useId, useMemo, useState, useTransition } from "react";
import { CalendarClock, CheckCircle2, MessageCircle, Send } from "lucide-react";

import { AppButton } from "@/components/common/app-button";
import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import { getMarketingAttribution, trackMarketingEvent } from "@/lib/public/analytics";
import {
  PUBLIC_CONTACT_METHOD_OPTIONS,
  PUBLIC_COUNTRY_CODE_OPTIONS,
  buildProjectEnquiryMessage,
  buildPublicPhoneNumber,
  getPublicWhatsAppHref,
} from "@/lib/public/site";
import { getMalaysiaDateValue, VIEWING_TIME_ZONE } from "@/lib/public/viewing";

export type PublicEnquiryProjectOption = {
  id: string;
  name: string;
  displayName?: string | null;
};

type PublicEnquiryFormProps = {
  projectId?: string;
  projectName?: string;
  projectOptions?: PublicEnquiryProjectOption[];
  initialName?: string;
  initialPhoneNumber?: string;
  initialEmail?: string;
  sourcePage?: string | null;
  submitLabel?: string;
  introTitle?: string;
  introDescription?: string;
  viewingRequest?: boolean;
};

const VIEWING_TIME_OPTIONS: AppSelectOption[] = Array.from(
  { length: 19 },
  (_, index) => {
    const totalMinutes = 9 * 60 + index * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const labelHour = hour > 12 ? hour - 12 : hour;
    const label = `${labelHour}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;

    return { value, label };
  },
);

function buildProjectSelectOptions(projectOptions: PublicEnquiryProjectOption[]): AppSelectOption[] {
  return projectOptions.map((project) => ({
    value: project.id,
    label: project.displayName ?? project.name,
  }));
}

export function PublicEnquiryForm({
  projectId,
  projectName,
  projectOptions = [],
  initialName = "",
  initialPhoneNumber = "",
  initialEmail = "",
  sourcePage,
  submitLabel = "Send Enquiry",
  introTitle = "Tell us what you are looking for",
  introDescription = "Share your details and we will follow up with project availability, pricing, and the best matching options.",
  viewingRequest = false,
}: PublicEnquiryFormProps) {
  const fieldId = useId();
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectId ?? projectOptions[0]?.id ?? "",
  );
  const [fullName, setFullName] = useState(initialName);
  const [countryCode, setCountryCode] = useState("+60");
  const [mobileNumber, setMobileNumber] = useState(initialPhoneNumber);
  const [email, setEmail] = useState(initialEmail);
  const [preferredContactMethod, setPreferredContactMethod] = useState("WHATSAPP");
  const [viewingDate, setViewingDate] = useState("");
  const [viewingTime, setViewingTime] = useState("");
  const [message, setMessage] = useState(
    projectName
      ? buildProjectEnquiryMessage(projectName)
      : viewingRequest
        ? "I would like to arrange a project viewing. Please confirm the preferred time with me."
        : "I am looking for a suitable project in Johor Bahru. Please contact me with the latest details.",
  );

  const selectedProject = useMemo(
    () => projectOptions.find((project) => project.id === selectedProjectId),
    [projectOptions, selectedProjectId],
  );

  const resolvedProjectId = projectId ?? selectedProjectId;
  const resolvedProjectName =
    projectName ?? selectedProject?.displayName ?? selectedProject?.name ?? "Selected project";

  const canSubmit = Boolean(
    fullName.trim() &&
      mobileNumber.trim() &&
      resolvedProjectId &&
      (!viewingRequest || (viewingDate && viewingTime)),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resolvedProjectId || !resolvedProjectName) {
      appToast.error("Please choose a project.");
      return;
    }

    const phoneNumber = buildPublicPhoneNumber(countryCode, mobileNumber);

    if (!phoneNumber) {
      appToast.error("Please enter a valid mobile number.");
      return;
    }

    startTransition(async () => {
      const result = await postJson<{ leadId: string; inquiryId?: string }>(
        "/api/public/leads",
        {
          projectId: resolvedProjectId,
          projectName: resolvedProjectName,
          fullName,
          phoneNumber,
          email,
          message,
          sourcePage:
            sourcePage ?? (typeof window !== "undefined" ? window.location.pathname : null),
          preferredContactMethod,
          attribution: getMarketingAttribution(),
          viewingPreference: viewingRequest
            ? { date: viewingDate, time: viewingTime, durationMinutes: 60 }
            : null,
        },
      );

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setIsSubmitted(true);
      trackMarketingEvent("generate_lead", {
        project_id: resolvedProjectId,
        project_name: resolvedProjectName,
        preferred_contact_method: preferredContactMethod,
      });
      if (viewingRequest) {
        trackMarketingEvent("viewing_request", {
          project_id: resolvedProjectId,
          project_name: resolvedProjectName,
        });
      }
      appToast.success(
        viewingRequest
          ? "Viewing request submitted successfully."
          : "Enquiry submitted successfully.",
      );
    });
  }

  if (isSubmitted) {
    const whatsappHref = getPublicWhatsAppHref(
      viewingRequest
        ? `Hi, I requested a viewing for ${resolvedProjectName}. Please confirm the appointment with me.`
        : `Hi, I have submitted an enquiry for ${resolvedProjectName}. Please follow up with me.`,
    );

    return (
      <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50/90 p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
        <h3 className="mt-4 text-xl font-black tracking-tight text-emerald-950">
          {viewingRequest ? "Viewing request received" : "Enquiry submitted"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-emerald-700">
          {viewingRequest
            ? "Your preferred time is pending confirmation. Our team will contact you with the final appointment details."
            : "Thank you. Our team will contact you soon with the latest project details, brochure, and available units."}
        </p>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
        >
          <MessageCircle className="size-4" />
          Continue on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
          {viewingRequest ? "Viewing Request" : "Enquiry"}
        </p>
        <h3 className="mt-2 text-2xl font-black tracking-tight text-card-foreground">
          {introTitle}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{introDescription}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {!projectId ? (
          <div className="space-y-2">
            <label id={`${fieldId}-project-label`} htmlFor={`${fieldId}-project`} className="block text-sm font-bold text-foreground">
              Project Interest <span className="text-red-500">*</span>
            </label>
            <AppSelect
              id={`${fieldId}-project`}
              ariaLabelledBy={`${fieldId}-project-label`}
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              options={buildProjectSelectOptions(projectOptions)}
              placeholder="Choose a project"
              searchable
              triggerClassName="h-12 w-full justify-between rounded-2xl border-border bg-background px-4 text-left text-sm font-semibold text-foreground shadow-sm"
              contentClassName="rounded-2xl"
            />
          </div>
        ) : null}

        {viewingRequest ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="flex items-start gap-3">
              <CalendarClock className="mt-0.5 size-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-black text-foreground">Preferred viewing time</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Choose a preferred slot in Malaysia time. The appointment is confirmed only after our team contacts you.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor={`${fieldId}-viewing-date`} className="block text-sm font-bold text-foreground">
                  Preferred Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id={`${fieldId}-viewing-date`}
                  name="viewingDate"
                  type="date"
                  min={getMalaysiaDateValue()}
                  value={viewingDate}
                  onChange={(event) => setViewingDate(event.target.value)}
                  required
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <label id={`${fieldId}-viewing-time-label`} htmlFor={`${fieldId}-viewing-time`} className="block text-sm font-bold text-foreground">
                  Preferred Time <span className="text-red-500">*</span>
                </label>
                <AppSelect
                  id={`${fieldId}-viewing-time`}
                  ariaLabelledBy={`${fieldId}-viewing-time-label`}
                  value={viewingTime}
                  onValueChange={setViewingTime}
                  options={VIEWING_TIME_OPTIONS}
                  placeholder="Choose a time"
                  triggerClassName="h-12 w-full justify-between rounded-2xl"
                />
              </div>
            </div>

            <p className="mt-3 text-xs font-semibold text-muted-foreground">
              Time zone: {VIEWING_TIME_ZONE.replaceAll("_", " ")} (UTC+8)
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor={`${fieldId}-name`} className="block text-sm font-bold text-foreground">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            id={`${fieldId}-name`}
            name="fullName"
            autoComplete="name"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your name"
            className="h-12 rounded-2xl"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
          <div className="space-y-2">
            <label id={`${fieldId}-country-code-label`} htmlFor={`${fieldId}-country-code`} className="block text-sm font-bold text-foreground">Country Code</label>
            <AppSelect
              id={`${fieldId}-country-code`}
              ariaLabelledBy={`${fieldId}-country-code-label`}
              value={countryCode}
              onValueChange={setCountryCode}
              options={PUBLIC_COUNTRY_CODE_OPTIONS}
              triggerClassName="h-12 w-full justify-between rounded-2xl border-border bg-background px-4 text-left text-sm font-semibold text-foreground shadow-sm"
              contentClassName="rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={`${fieldId}-mobile`} className="block text-sm font-bold text-foreground">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <Input
              id={`${fieldId}-mobile`}
              name="mobileNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              required
              value={mobileNumber}
              onChange={(event) => setMobileNumber(event.target.value)}
              placeholder="Example: 104608699"
              className="h-12 rounded-2xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor={`${fieldId}-email`} className="block text-sm font-bold text-foreground">Email</label>
          <Input
            id={`${fieldId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Optional email"
            className="h-12 rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <label id={`${fieldId}-contact-method-label`} htmlFor={`${fieldId}-contact-method`} className="block text-sm font-bold text-foreground">
            Preferred Contact Method
          </label>
          <AppSelect
            id={`${fieldId}-contact-method`}
            ariaLabelledBy={`${fieldId}-contact-method-label`}
            value={preferredContactMethod}
            onValueChange={setPreferredContactMethod}
            options={PUBLIC_CONTACT_METHOD_OPTIONS}
            triggerClassName="h-12 w-full justify-between rounded-2xl border-border bg-background px-4 text-left text-sm font-semibold text-foreground shadow-sm"
            contentClassName="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor={`${fieldId}-message`} className="block text-sm font-bold text-foreground">Message</label>
          <textarea
            id={`${fieldId}-message`}
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <AppButton
          type="submit"
          disabled={!canSubmit || isPending}
          className="h-12 w-full rounded-2xl text-sm"
        >
          {isPending ? (
            "Submitting..."
          ) : (
            <span className="inline-flex items-center gap-2">
              <Send className="size-4" />
              {submitLabel}
            </span>
          )}
        </AppButton>
      </form>
    </div>
  );
}
