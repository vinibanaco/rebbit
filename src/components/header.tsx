"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

type HeaderProps = {
  user: User | null;
};

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-background border-b">
      <div className="container flex items-center justify-between h-14 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-orange-500">Rebbit</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/posts/new" passHref>
                <Button variant="outline" size="sm">
                  Create Post
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm hidden md:inline">
                  Welcome, {user.username}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <Link href="/login" passHref>
              <Button size="sm">Login / Register</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
