"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Comment } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type CommentCardProps = {
  comment: Comment;
  isAuthenticated: boolean;
};

export default function CommentCard({
  comment,
  isAuthenticated,
}: CommentCardProps) {
  const router = useRouter();
  const [voteScore, setVoteScore] = useState(comment.vote_score);
  const [userVote, setUserVote] = useState(comment.userVote || 0);
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
        body: JSON.stringify({ commentId: comment.id, value }),
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
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleVote(1)}
              disabled={!isAuthenticated || isVoting}
              className={`h-6 w-6 ${userVote === 1 ? "text-orange-500" : ""}`}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium my-0.5">{voteScore}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleVote(-1)}
              disabled={!isAuthenticated || isVoting}
              className={`h-6 w-6 ${userVote === -1 ? "text-blue-500" : ""}`}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1">
            <div className="text-sm font-medium mb-1">
              {comment.author} • {formatDate(comment.created_at)}
            </div>
            <p className="text-sm">{comment.content}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
