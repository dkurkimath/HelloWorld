import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import SignInButton from "./SignInButton";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/documents");

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-paper">
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-10 w-full max-w-sm text-center">
        <h1 className="font-display text-2xl font-bold text-navy mb-1">The Sophia Way</h1>
        <p className="text-sm text-black/50 mb-8">Shelter. Safety. Stability.<br/>Board &amp; staff member portal</p>
        <SignInButton />
        <p className="text-xs text-black/40 mt-6">Sign in with your sophiaway.org Google account.</p>
      </div>
    </div>
  );
}
