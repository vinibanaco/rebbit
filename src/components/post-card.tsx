"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type PostCardProps = {
  post: Post;
  isAuthenticated: boolean;
};

export default function PostCard({ post, isAuthenticated }: PostCardProps) {
  const router = useRouter();
  const [voteScore, setVoteScore] = useState(post.vote_score);
  const [userVote, setUserVote] = useState(post.userVote || 0);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (value: number) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isVoting) return;

    setIsVoting(true);

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, value }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const data = await response.json();
      setVoteScore(data.voteScore);
      setUserVote(data.userVote);
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <div className="flex">
        <div className="flex flex-col items-center p-4 bg-muted">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleVote(1)}
            disabled={!isAuthenticated || isVoting}
            className={userVote === 1 ? "text-orange-500" : ""}
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
          <span className="font-bold my-1">{voteScore}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleVote(-1)}
            disabled={!isAuthenticated || isVoting}
            className={userVote === -1 ? "text-blue-500" : ""}
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1">
          <CardHeader className="pb-2">
            <div className="text-sm text-muted-foreground">
              Posted by {post.author} • {formatDate(post.created_at)}
            </div>
            <CardTitle className="text-xl">
              <Link href={`/posts/${post.id}`} className="hover:underline">
                {post.title}
              </Link>
            </CardTitle>
          </CardHeader>

          <CardContent className="pb-2">
            <p className="line-clamp-3">{post.content}</p>
          </CardContent>

          <CardFooter className="pt-0">
            <Link href={`/posts/${post.id}`} passHref>
              <Button variant="ghost" size="sm" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                {post.comment_count}{" "}
                {post.comment_count === 1 ? "comment" : "comments"}
              </Button>
            </Link>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
