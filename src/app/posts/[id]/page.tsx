import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import CommentCard from "@/components/comment-card";
import CreateCommentForm from "@/components/create-comment-form";
import type { Post, Comment } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const postIdStr = (await params).id;
  const postId = Number.parseInt(postIdStr, 10);

  try {
    const [post] = await sql`
      SELECT title FROM posts WHERE id = ${postId}
    `;

    if (!post) {
      return {
        title: "Post Not Found - Rebbit",
      };
    }

    return {
      title: `${post.title} - Rebbit`,
      description: `View and discuss: ${post.title}`,
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Post - Rebbit",
    };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const postIdStr = (await params).id;
  const postId = Number.parseInt(postIdStr, 10);
  const user = await getCurrentUser();

  // Get post details
  const [post] = (await sql`
    SELECT 
      p.id, 
      p.title, 
      p.content, 
      p.created_at, 
      u.username as author,
      COALESCE(SUM(v.value), 0) as vote_score
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN votes v ON p.id = v.post_id
    WHERE p.id = ${postId}
    GROUP BY p.id, u.username
  `) as Post[];

  if (!post) {
    notFound();
  }

  // Get comments for the post
  const comments = (await sql`
    SELECT 
      c.id, 
      c.content, 
      c.created_at, 
      u.username as author,
      COALESCE(SUM(v.value), 0) as vote_score
    FROM comments c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN votes v ON c.id = v.comment_id
    WHERE c.post_id = ${postId}
    GROUP BY c.id, u.username
    ORDER BY c.created_at DESC
  `) as Comment[];

  // If user is logged in, get their votes
  let userPostVote = null;
  let userCommentVotes: { comment_id: number; value: number }[] = [];

  if (user) {
    // Get user's vote on this post
    const [postVote] = await sql`
      SELECT value
      FROM votes
      WHERE user_id = ${user.id} AND post_id = ${postId}
    `;

    userPostVote = postVote ? postVote.value : 0;

    // Get user's votes on these comments
    if (comments.length > 0) {
      const commentIdsPlaceholders = comments
        .map((_, index) => `$${index + 1}`)
        .join(", ");
      const commentIds = comments.map((c) => c.id);

      userCommentVotes = (await sql.query(
        `
        SELECT comment_id, value
        FROM votes
        WHERE user_id = ${user.id} AND comment_id IN (${commentIdsPlaceholders})
      `,
        commentIds
      )) as { comment_id: number; value: number }[];
    }
  }

  // Add user votes to comments
  const commentsWithUserVotes = comments.map((comment: Comment) => {
    if (user) {
      const userVote = userCommentVotes.find(
        (vote) => vote.comment_id === comment.id
      );
      return {
        ...comment,
        userVote: userVote ? userVote.value : 0,
      };
    }
    return comment;
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/" passHref>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Posts
          </Button>
        </Link>
      </div>

      <Card className="mb-8">
        <div className="flex">
          <div className="flex flex-col items-center p-4 bg-muted">
            <Button
              variant="ghost"
              size="icon"
              className={userPostVote === 1 ? "text-orange-500" : ""}
              disabled
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
            <span className="font-bold my-1">{post.vote_score}</span>
            <Button
              variant="ghost"
              size="icon"
              className={userPostVote === -1 ? "text-blue-500" : ""}
              disabled
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1">
            <CardHeader className="pb-2">
              <div className="text-sm text-muted-foreground">
                Posted by {post.author} • {formatDate(post.created_at)}
              </div>
              <CardTitle className="text-2xl">{post.title}</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-line">{post.content}</p>
            </CardContent>
          </div>
        </div>
      </Card>

      <div className="mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </h2>

        {user ? (
          <CreateCommentForm postId={postId} />
        ) : (
          <Card className="mb-6">
            <CardContent className="py-4 text-center">
              <p className="mb-2">You need to be logged in to comment</p>
              <Link href="/login" passHref>
                <Button>Login / Register</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {commentsWithUserVotes.length > 0 ? (
          commentsWithUserVotes.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              isAuthenticated={!!user}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}
