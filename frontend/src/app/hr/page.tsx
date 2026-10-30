import { redirect } from "next/navigation";

// There is one sign-in for every role; /hr is kept so old links still work.
export default function HrPage() {
  redirect("/admin/login");
}
