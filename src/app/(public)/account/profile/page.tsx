import { AppStatusBadge } from "@/components/common/app-status-badge";
import { CustomerProfileForm } from "@/components/public/customer-profile-form";
import { getCustomerAccountData } from "@/lib/public/account";
import { isPhonePlaceholderEmail } from "@/lib/public/profile-validation";

export const metadata = { title: "Profile", robots: { index: false, follow: false } };

export default async function CustomerProfilePage() {
  const { user } = await getCustomerAccountData("/account/profile");
  const displayEmail = isPhonePlaceholderEmail(user.email) ? null : user.email;

  return (
    <section className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">Profile</h2>
          <p className="mt-2 text-sm text-muted-foreground">Identity details used to connect your enquiries and bookings.</p>
        </div>
        <div className="flex gap-2">
          <AppStatusBadge tone={user.phoneNumberVerified ? "success" : "warning"}>{user.phoneNumberVerified ? "Mobile verified" : "Mobile pending"}</AppStatusBadge>
          <AppStatusBadge tone={user.emailVerified ? "success" : "warning"}>{user.emailVerified ? "Email verified" : "Email pending"}</AppStatusBadge>
        </div>
      </div>

      <CustomerProfileForm
        initialName={user.name}
        initialNationality={user.nationality}
        initialPhoneNumber={user.phoneNumber}
        email={displayEmail}
        emailVerified={Boolean(displayEmail && user.emailVerified)}
      />
    </section>
  );
}
