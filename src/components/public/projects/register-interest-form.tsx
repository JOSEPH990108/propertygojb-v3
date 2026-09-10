import { PublicEnquiryForm } from "@/components/public/public-enquiry-form";

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
  return (
    <PublicEnquiryForm
      projectId={projectId}
      projectName={projectName}
      initialName={initialName}
      initialPhoneNumber={initialPhoneNumber}
      initialEmail={initialEmail}
    />
  );
}
