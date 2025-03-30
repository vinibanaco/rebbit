import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Login - Rebbit",
  description: "Login or register for Rebbit",
};

export default async function LoginPage() {
  const user = await getCurrentUser();

  // If user is already logged in, redirect to home
  if (user) {
    redirect("/");
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold text-center mb-6">Welcome to Rebbit</h1>
      <AuthForm />
    </div>
  );
}
