"use client";

import { FormEvent, useState, useTransition } from "react";
import { CheckCircle2, MessageCircle, Send } from "lucide-react";

import { AppButton } from "@/components/common/app-button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api/client";
import { appToast } from "@/lib/app-toast";

type RegisterInterestFormProps = {
  projectId: string;
  projectName: string;
  initialName?: string;
  initialPhoneNumber?: string;
  initialEmail?: string;
};

export function RegisterInterestForm({
  projectId,
  projectName,
  initialName = "",
  initialPhoneNumber = "",
  initialEmail = "",
}: RegisterInterestFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [fullName, setFullName] = useState(initialName);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState(
    `Hi, I am interested in ${projectName}. Please send me more details.`,
  );

  const canSubmit = Boolean(fullName.trim() && phoneNumber.trim());

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await postJson("/api/public/leads", {
        projectId,
        projectName,
        fullName,
        phoneNumber,
        email,
        message,
        sourcePage:
          typeof window !== "undefined" ? window.location.pathname : null,
      });

      if (!result.ok) {
        appToast.error(result.message);
        return;
      }

      setIsSubmitted(true);
      appToast.success("Enquiry submitted successfully.");
    });
  }

  if (isSubmitted) {
    return (
      <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
        <h3 className="mt-4 text-xl font-black tracking-tight text-emerald-950">
          Enquiry submitted
        </h3>
        <p className="mt-2 text-sm leading-6 text-emerald-700">
          Thank you. Our team will contact you soon with the latest project
          details, brochure, and available units.
        </p>

        <a
          href={`https://wa.me/60104608699?text=${encodeURIComponent(
            `Hi, I have submitted interest for ${projectName}. Please follow up with me.`,
          )}`}
          target="_blank"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
        >
          <MessageCircle className="size-4" />
          Continue on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="space-y-2">
        <span className="text-sm font-bold text-slate-700">
          Name <span className="text-red-500">*</span>
        </span>
        <Input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Your name"
          className="h-12 rounded-2xl"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-bold text-slate-700">
          Mobile Number <span className="text-red-500">*</span>
        </span>
        <Input
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder="Example: 0104608699"
          className="h-12 rounded-2xl"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-bold text-slate-700">Email</span>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Optional email"
          className="h-12 rounded-2xl"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-bold text-slate-700">Message</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </label>

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
            Register Interest
          </span>
        )}
      </AppButton>
    </form>
  );
}
