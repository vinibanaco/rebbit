import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
      <p className="text-xl text-muted-foreground mb-8">
        {"The page you're looking for doesn't exist or has been moved."}
      </p>
      <Link href="/" passHref>
        <Button>Return to Home</Button>
      </Link>
    </div>
  );
}
