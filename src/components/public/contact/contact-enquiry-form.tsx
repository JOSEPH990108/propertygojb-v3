"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { ArrowRight, CheckCircle2, MessageCircle, Send } from "lucide-react";

import { AppButton } from "@/components/common/app-button";
import { AppFieldError } from "@/components/common/app-field-error";
import { AppSelect, type AppSelectOption } from "@/components/common/app-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";
import { getMarketingAttribution, trackMarketingEvent } from "@/lib/public/analytics";
import {
  PUBLIC_COUNTRY_CODE_OPTIONS,
  buildPublicPhoneNumber,
  getPublicWhatsAppHref,
} from "@/lib/public/site";
import { cn } from "@/lib/utils";

import type { ContactEnquiryPath } from "./contact-enquiry-experience";

export type ContactEnquiryProjectOption = {
  id: string;
  name: string;
  displayName: string | null;
};

type ChipOption = { value: string; label: string };

const INTEREST_TOPIC_OPTIONS: ChipOption[] = [
  { value: "PRICE_PROMOTION", label: "Price & Promotion" },
  { value: "AVAILABLE_UNITS", label: "Available Units" },
  { value: "FLOOR_PLANS", label: "Floor Plans" },
  { value: "BOOK_VIEWING", label: "Book a Viewing" },
  { value: "LOAN_PAYMENT", label: "Loan / Monthly Payment" },
  { value: "MORE_DETAILS", label: "More Details" },
];

const PURPOSE_OPTIONS: ChipOption[] = [
  { value: "OWN_STAY", label: "Own Stay" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "BOTH", label: "Both" },
  { value: "NOT_SURE", label: "Not Sure Yet" },
];

const PROPERTY_TYPE_OPTIONS: ChipOption[] = [
  { value: "LANDED", label: "Landed" },
  { value: "CONDO", label: "Condo" },
  { value: "EITHER", label: "Either is fine" },
  { value: "NOT_SURE", label: "Not sure" },
];

const LANDED_SUBTYPE_OPTIONS: ChipOption[] = [
  { value: "SINGLE_STOREY", label: "Single Storey" },
  { value: "DOUBLE_STOREY", label: "Double Storey" },
  { value: "CLUSTER_SEMI_D", label: "Cluster / Semi-D" },
  { value: "NO_PREFERENCE", label: "No Preference" },
];

const BUDGET_OPTIONS: ChipOption[] = [
  { value: "BELOW_500K", label: "Below RM500K" },
  { value: "500K_700K", label: "RM500K \u2013 RM700K" },
  { value: "700K_900K", label: "RM700K \u2013 RM900K" },
  { value: "900K_1_2M", label: "RM900K \u2013 RM1.2M" },
  { value: "1_2M_PLUS", label: "RM1.2M+" },
  { value: "NOT_SURE", label: "Not sure yet" },
];

const TIMELINE_OPTIONS: ChipOption[] = [
  { value: "ASAP", label: "ASAP" },
  { value: "WITHIN_3_MONTHS", label: "Within 3 months" },
  { value: "3_6_MONTHS", label: "3 \u2013 6 months" },
  { value: "6_12_MONTHS", label: "6 \u2013 12 months" },
  { value: "JUST_EXPLORING", label: "Just exploring" },
];

const PREFERRED_CONTACT_OPTIONS: { value: "WHATSAPP" | "CALL"; label: string }[] = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "CALL", label: "Phone Call" },
];

function optionLabel(options: ChipOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? null;
}

/** Larger bordered choice used for the primary buying-purpose / property-type questions. */
function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option: ChipOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "h-12 w-full border px-4 text-left text-sm font-semibold transition-colors",
        selected
          ? "border-public-decorative bg-brand-subtle text-brand-subtle-foreground"
          : "border-border bg-background text-foreground hover:bg-muted",
      )}
    >
      {option.label}
    </button>
  );
}

/** Compact pill used for single-tap refinements (budget, timeline, topics, contact method). */
function Chip({
  option,
  selected,
  onSelect,
}: {
  option: ChipOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
        selected
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-background text-foreground hover:bg-muted",
      )}
    >
      {option.label}
    </button>
  );
}

function toggleValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

const MAX_VISIBLE_AREA_SUGGESTIONS = 10;

/**
 * Typeahead + tag input for "preferred area". Selected areas render as
 * removable chips; unselected suggestions (from the areas database table,
 * capped at 10 visible) render as "+ label" pills; typing a value that isn't
 * in the list and pressing Enter/comma adds it as a free-text chip.
 */
function AreaTagInput({
  id,
  options,
  selected,
  onChange,
}: {
  id: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const selectedLower = useMemo(
    () => new Set(selected.map((area) => area.toLowerCase())),
    [selected],
  );

  const suggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return options
      .filter((option) => !selectedLower.has(option.toLowerCase()))
      .filter(
        (option) =>
          normalizedQuery.length === 0 ||
          option.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, MAX_VISIBLE_AREA_SUGGESTIONS);
  }, [options, query, selectedLower]);

  function addArea(rawValue: string) {
    const value = rawValue.trim();
    if (!value || selectedLower.has(value.toLowerCase())) {
      setQuery("");
      return;
    }
    onChange([...selected, value]);
    setQuery("");
  }

  function removeArea(value: string) {
    onChange(selected.filter((area) => area !== value));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addArea(query);
      return;
    }
    if (event.key === "Backspace" && query.length === 0 && selected.length > 0) {
      removeArea(selected[selected.length - 1]);
    }
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => removeArea(area)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-brand bg-brand px-4 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
            >
              {area}
              <span aria-hidden="true">{"\u00d7"}</span>
              <span className="sr-only">Remove {area}</span>
            </button>
          ))}
        </div>
      ) : null}

      <Input
        id={id}
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type an area, e.g. Bukit Indah"
        aria-label="Search or type a preferred area"
      />

      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => addArea(area)}
              className="inline-flex h-10 items-center rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              + {area}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function buildKnownMessage(interests: string[], extraMessage: string) {
  const parts: string[] = [];

  if (interests.length > 0) {
    parts.push(`Would like to know: ${interests.join(", ")}.`);
  }

  if (extraMessage.trim()) {
    parts.push(extraMessage.trim());
  }

  return parts.length > 0
    ? parts.join(" ")
    : "Please share the latest brochure, price list, and available units.";
}

function buildDiscoverMessage(input: {
  purpose: string;
  propertyType: string;
  landedSubtype: string;
  budgetRange: string;
  areas: string[];
  openToRecommendations: boolean;
  timeline: string;
  extraMessage: string;
}) {
  const lines: string[] = [
    "Help me find a matching property (no specific project chosen yet).",
  ];

  const purposeLabel = optionLabel(PURPOSE_OPTIONS, input.purpose);
  if (purposeLabel) lines.push(`Buying for: ${purposeLabel}.`);

  const propertyTypeLabel = optionLabel(PROPERTY_TYPE_OPTIONS, input.propertyType);
  if (propertyTypeLabel) {
    const subtypeLabel = optionLabel(LANDED_SUBTYPE_OPTIONS, input.landedSubtype);
    lines.push(
      `Property type: ${propertyTypeLabel}${
        input.propertyType === "LANDED" && subtypeLabel ? ` (${subtypeLabel})` : ""
      }.`,
    );
  }

  const budgetLabel = optionLabel(BUDGET_OPTIONS, input.budgetRange);
  if (budgetLabel) lines.push(`Budget: ${budgetLabel}.`);

  if (input.areas.length > 0 || input.openToRecommendations) {
    const areaText =
      input.areas.length > 0 ? input.areas.join(", ") : "No specific area";
    lines.push(
      `Preferred area(s): ${areaText}${
        input.openToRecommendations ? " (open to recommendations)." : "."
      }`,
    );
  }

  const timelineLabel = optionLabel(TIMELINE_OPTIONS, input.timeline);
  if (timelineLabel) lines.push(`Planning to buy: ${timelineLabel}.`);

  if (input.extraMessage.trim()) lines.push(input.extraMessage.trim());

  return lines.join(" ");
}

type ContactEnquiryFormProps = {
  path: ContactEnquiryPath;
  projects: ContactEnquiryProjectOption[];
  areaOptions: string[];
};

export function ContactEnquiryForm({
  path,
  projects,
  areaOptions,
}: ContactEnquiryFormProps) {
  const fieldId = useId();
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState(0);

  // "I know the project" fields
  const [selectedProjectId, setSelectedProjectId] = useState(
    projects[0]?.id ?? "",
  );
  const [interests, setInterests] = useState<string[]>([]);

  // "Help me find a property" fields
  const [purpose, setPurpose] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [landedSubtype, setLandedSubtype] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [openToRecommendations, setOpenToRecommendations] = useState(true);
  const [timeline, setTimeline] = useState("");

  // Shared fields
  const [extraMessage, setExtraMessage] = useState("");
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+60");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [showEmailField, setShowEmailField] = useState(false);
  const [preferredContactMethod, setPreferredContactMethod] = useState<
    "WHATSAPP" | "CALL"
  >("WHATSAPP");

  const [projectError, setProjectError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const projectSelectOptions: AppSelectOption[] = useMemo(
    () =>
      projects.map((project) => ({
        value: project.id,
        label: project.displayName ?? project.name,
      })),
    [projects],
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId],
  );

  const canContinueStep1 = path === "KNOWN" ? Boolean(selectedProjectId) : true;
  const canSubmit = Boolean(fullName.trim() && mobileNumber.trim());

  function handleContinue() {
    if (path === "KNOWN" && !selectedProjectId) {
      setProjectError("Please choose a project.");
      return;
    }
    setProjectError(null);
    setStep(1);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const fallbackProject = projects[0];
    const resolvedProjectId =
      path === "KNOWN" ? selectedProjectId : (fallbackProject?.id ?? "");
    const resolvedProjectName =
      path === "KNOWN"
        ? (selectedProject?.displayName ?? selectedProject?.name ?? "")
        : (fallbackProject?.displayName ?? fallbackProject?.name ?? "");

    if (!resolvedProjectId || !resolvedProjectName) {
      setProjectError("Please choose a project.");
      setStep(0);
      return;
    }

    const phoneNumber = buildPublicPhoneNumber(countryCode, mobileNumber);

    if (!phoneNumber) {
      setMobileError("Please enter a valid mobile number.");
      mobileInputRef.current?.focus();
      return;
    }
    setMobileError(null);

    const message =
      path === "KNOWN"
        ? buildKnownMessage(interests, extraMessage)
        : buildDiscoverMessage({
            purpose,
            propertyType,
            landedSubtype,
            budgetRange,
            areas: selectedAreas,
            openToRecommendations,
            timeline,
            extraMessage,
          });

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
            typeof window !== "undefined" ? window.location.pathname : null,
          preferredContactMethod,
          attribution: getMarketingAttribution(),
          viewingPreference: null,
        },
      );

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      setIsSubmitted(true);
      trackMarketingEvent("generate_lead", {
        project_id: resolvedProjectId,
        project_name: resolvedProjectName,
        preferred_contact_method: preferredContactMethod,
      });
      appToast.success("Enquiry submitted successfully.");
    });
  }

  if (projects.length === 0) {
    return (
      <div className="border border-border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm leading-6 text-muted-foreground">
          We are updating our project catalog right now. Please reach us
          directly on WhatsApp and our team will help you immediately.
        </p>
        <a
          href={getPublicWhatsAppHref(
            "Hi, I would like to enquire about a property in Johor Bahru.",
          )}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 bg-success px-5 text-sm font-black text-success-foreground shadow-sm transition hover:brightness-95"
        >
          <MessageCircle className="size-4" />
          Chat on WhatsApp
        </a>
      </div>
    );
  }

  if (isSubmitted) {
    const whatsappHref = getPublicWhatsAppHref(
      "Hi, I have submitted an enquiry. Please follow up with me.",
    );

    return (
      <div className="border border-emerald-200 bg-emerald-50/90 p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
        <h3 className="mt-4 text-xl font-black tracking-tight text-emerald-950">
          Enquiry submitted
        </h3>
        <p className="mt-2 text-sm leading-6 text-emerald-700">
          Thank you. Our team will contact you soon with the latest project
          details, brochure, and available units.
        </p>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 bg-success px-5 text-sm font-black text-success-foreground shadow-sm transition hover:brightness-95"
        >
          <MessageCircle className="size-4" />
          Continue on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
      <ol className="flex items-center gap-3 text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
        <li
          className={cn(
            "flex items-center gap-2",
            step === 0 && "text-foreground",
          )}
          aria-current={step === 0 ? "step" : undefined}
        >
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full border border-border text-[11px]",
              step === 0 && "border-brand bg-brand text-brand-foreground",
              step > 0 && "border-success bg-success text-success-foreground",
            )}
          >
            {step > 0 ? <CheckCircle2 className="size-3.5" /> : "01"}
          </span>
          {path === "KNOWN" ? "Your Enquiry" : "Your Preferences"}
        </li>
        <li className="h-px w-8 bg-border" aria-hidden="true" />
        <li
          className={cn(
            "flex items-center gap-2",
            step === 1 && "text-foreground",
          )}
          aria-current={step === 1 ? "step" : undefined}
        >
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full border border-border text-[11px]",
              step === 1 && "border-brand bg-brand text-brand-foreground",
            )}
          >
            02
          </span>
          Contact Details
        </li>
      </ol>

      <div className="mt-6 border-t border-border pt-6">
        {step === 0 ? (
          <div className="space-y-6">
            {path === "KNOWN" ? (
              <>
                <div className="space-y-2">
                  <label
                    id={`${fieldId}-project-label`}
                    htmlFor={`${fieldId}-project`}
                    className="block text-sm font-bold text-foreground"
                  >
                    Which project are you interested in?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <AppSelect
                    id={`${fieldId}-project`}
                    ariaLabelledBy={`${fieldId}-project-label`}
                    ariaDescribedBy={
                      projectError ? `${fieldId}-project-error` : undefined
                    }
                    ariaInvalid={Boolean(projectError)}
                    value={selectedProjectId}
                    onValueChange={(nextValue) => {
                      setSelectedProjectId(nextValue);
                      setProjectError(null);
                    }}
                    options={projectSelectOptions}
                    placeholder="Search or select a project"
                    searchable
                    triggerClassName="h-12 w-full justify-between rounded-none border-border bg-background px-4 text-left text-sm font-semibold text-foreground shadow-sm"
                    contentClassName="rounded-none"
                  />
                  <AppFieldError id={`${fieldId}-project-error`}>
                    {projectError}
                  </AppFieldError>
                </div>

                <fieldset>
                  <legend className="mb-2 block text-sm font-bold text-foreground">
                    What would you like to know?
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_TOPIC_OPTIONS.map((option) => (
                      <Chip
                        key={option.value}
                        option={option}
                        selected={interests.includes(option.value)}
                        onSelect={() =>
                          setInterests((current) =>
                            toggleValue(current, option.value),
                          )
                        }
                      />
                    ))}
                  </div>
                </fieldset>
              </>
            ) : (
              <>
                <fieldset>
                  <legend className="mb-2 block text-sm font-bold text-foreground">
                    What are you buying for?
                  </legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PURPOSE_OPTIONS.map((option) => (
                      <OptionCard
                        key={option.value}
                        option={option}
                        selected={purpose === option.value}
                        onSelect={() => setPurpose(option.value)}
                      />
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 block text-sm font-bold text-foreground">
                    What type of property do you prefer?
                  </legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                      <OptionCard
                        key={option.value}
                        option={option}
                        selected={propertyType === option.value}
                        onSelect={() => {
                          setPropertyType(option.value);
                          if (option.value !== "LANDED") setLandedSubtype("");
                        }}
                      />
                    ))}
                  </div>
                </fieldset>

                {propertyType === "LANDED" ? (
                  <fieldset className="bg-muted p-4">
                    <legend className="mb-2 block text-sm font-bold text-foreground">
                      What type of landed property?
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {LANDED_SUBTYPE_OPTIONS.map((option) => (
                        <Chip
                          key={option.value}
                          option={option}
                          selected={landedSubtype === option.value}
                          onSelect={() => setLandedSubtype(option.value)}
                        />
                      ))}
                    </div>
                  </fieldset>
                ) : null}

                <fieldset>
                  <legend className="mb-2 block text-sm font-bold text-foreground">
                    What&apos;s your budget range?
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {BUDGET_OPTIONS.map((option) => (
                      <Chip
                        key={option.value}
                        option={option}
                        selected={budgetRange === option.value}
                        onSelect={() => setBudgetRange(option.value)}
                      />
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 block text-sm font-bold text-foreground">
                    Any preferred area?
                  </legend>
                  <AreaTagInput
                    id={`${fieldId}-area`}
                    options={areaOptions}
                    selected={selectedAreas}
                    onChange={setSelectedAreas}
                  />
                  <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={openToRecommendations}
                      onChange={(event) =>
                        setOpenToRecommendations(event.target.checked)
                      }
                      className="size-4 rounded-none border-border accent-brand"
                    />
                    I&apos;m open to recommendations
                  </label>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 block text-sm font-bold text-foreground">
                    When are you planning to buy?
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {TIMELINE_OPTIONS.map((option) => (
                      <Chip
                        key={option.value}
                        option={option}
                        selected={timeline === option.value}
                        onSelect={() => setTimeline(option.value)}
                      />
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            <div className="space-y-2">
              <label
                htmlFor={`${fieldId}-extra-message`}
                className="block text-sm font-bold text-foreground"
              >
                Anything you&apos;d like us to know?
              </label>
              <Textarea
                id={`${fieldId}-extra-message`}
                value={extraMessage}
                onChange={(event) => setExtraMessage(event.target.value)}
                rows={3}
                placeholder="Add a message (optional)"
                className="rounded-none"
              />
            </div>

            <AppButton
              type="button"
              onClick={handleContinue}
              disabled={!canContinueStep1}
              className="h-12 w-full rounded-none text-sm"
            >
              <span className="inline-flex items-center gap-2">
                Continue
                <ArrowRight className="size-4" />
              </span>
            </AppButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor={`${fieldId}-name`}
                className="block text-sm font-bold text-foreground"
              >
                Your Name <span className="text-red-500">*</span>
              </label>
              <Input
                id={`${fieldId}-name`}
                name="fullName"
                autoComplete="name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="How should we address you?"
                className="h-12 rounded-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
              <div className="space-y-2">
                <label
                  id={`${fieldId}-country-code-label`}
                  htmlFor={`${fieldId}-country-code`}
                  className="block text-sm font-bold text-foreground"
                >
                  Country Code
                </label>
                <AppSelect
                  id={`${fieldId}-country-code`}
                  ariaLabelledBy={`${fieldId}-country-code-label`}
                  value={countryCode}
                  onValueChange={setCountryCode}
                  options={PUBLIC_COUNTRY_CODE_OPTIONS}
                  searchable
                  searchPlaceholder="Search country..."
                  triggerClassName="h-12 w-full justify-between rounded-none border-border bg-background px-4 text-left text-sm font-semibold text-foreground shadow-sm"
                  contentClassName="rounded-none"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`${fieldId}-mobile`}
                  className="block text-sm font-bold text-foreground"
                >
                  WhatsApp Number <span className="text-red-500">*</span>
                </label>
                <Input
                  id={`${fieldId}-mobile`}
                  name="mobileNumber"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  required
                  ref={mobileInputRef}
                  aria-invalid={Boolean(mobileError)}
                  aria-describedby={
                    mobileError ? `${fieldId}-mobile-error` : undefined
                  }
                  value={mobileNumber}
                  onChange={(event) => {
                    setMobileNumber(event.target.value);
                    setMobileError(null);
                  }}
                  placeholder="Example: 104608699"
                  className="h-12 rounded-none"
                />
                <AppFieldError id={`${fieldId}-mobile-error`}>
                  {mobileError}
                </AppFieldError>
              </div>
            </div>

            <fieldset>
              <legend className="mb-2 block text-sm font-bold text-foreground">
                Preferred Contact
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {PREFERRED_CONTACT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={preferredContactMethod === option.value}
                    onClick={() => setPreferredContactMethod(option.value)}
                    className={cn(
                      "h-11 border px-4 text-sm font-semibold transition-colors",
                      preferredContactMethod === option.value
                        ? "border-public-decorative bg-brand-subtle text-brand-subtle-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {showEmailField ? (
              <div className="space-y-2">
                <label
                  htmlFor={`${fieldId}-email`}
                  className="block text-sm font-bold text-foreground"
                >
                  Email
                </label>
                <Input
                  id={`${fieldId}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Optional email"
                  className="h-12 rounded-none"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowEmailField(true)}
                className="text-sm font-bold text-public-decorative underline underline-offset-4 hover:opacity-80"
              >
                + Add email
              </button>
            )}

            <div className="space-y-2">
              <label
                htmlFor={`${fieldId}-message`}
                className="block text-sm font-bold text-foreground"
              >
                Anything else we should know? <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id={`${fieldId}-message`}
                value={extraMessage}
                onChange={(event) => setExtraMessage(event.target.value)}
                rows={3}
                placeholder="Add a message (optional)"
                className="rounded-none"
              />
            </div>

            <AppFieldError id={`${fieldId}-form-error`} className="text-center">
              {formError}
            </AppFieldError>

            <AppButton
              type="submit"
              disabled={!canSubmit || isPending}
              isLoading={isPending}
              className="h-12 w-full rounded-none text-sm"
            >
              {isPending ? (
                "Submitting..."
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Send className="size-4" />
                  {path === "KNOWN" ? "Send Enquiry" : "Get Project Details"}
                </span>
              )}
            </AppButton>

            <p className="text-center text-xs text-muted-foreground">
              We&apos;ll contact you about this enquiry only.
            </p>

            <button
              type="button"
              onClick={() => setStep(0)}
              className="mx-auto flex items-center gap-1 text-sm font-bold text-foreground hover:opacity-80"
            >
              &larr; Back to {path === "KNOWN" ? "enquiry" : "preferences"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
