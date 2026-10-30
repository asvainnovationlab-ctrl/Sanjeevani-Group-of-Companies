import { Suspense } from "react";
import SetPasswordForm from "@/components/admin/SetPasswordForm";

export const metadata = { title: "Reset your password | Sanjeevani Group" };

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm mode="reset" />
    </Suspense>
  );
}
