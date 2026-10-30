import { Suspense } from "react";
import SetPasswordForm from "@/components/admin/SetPasswordForm";

export const metadata = { title: "Activate your account | Sanjeevani Group" };

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <SetPasswordForm mode="invite" />
    </Suspense>
  );
}
