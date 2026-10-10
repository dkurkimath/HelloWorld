"use client";
import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/documents" })}
      className="w-full bg-navy text-white rounded-lg py-3 font-medium hover:bg-navy-dark transition"
    >
      Sign in with Google
    </button>
  );
}
