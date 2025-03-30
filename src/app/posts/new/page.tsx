import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import CreatePostForm from "@/components/create-post-form";

export const metadata: Metadata = {
  title: "Create Post - Rebbit",
  description: "Create a new post on Rebbit",
};

export default async function CreatePostPage() {
  try {
    // This will redirect to login if user is not authenticated
    await requireAuth();

    return (
      <div className="max-w-3xl mx-auto py-6">
        <CreatePostForm />
      </div>
    );
  } catch {
    // This will be caught by requireAuth and redirect to login
    redirect("/login");
  }
}
