import Link from "next/link";
import { Button } from "@/components/ui/button";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import PostCard from "@/components/post-card";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const user = await getCurrentUser();

  // Get all posts with vote counts and comment counts
  const posts = (await sql`
    SELECT 
      p.id, 
      p.title, 
      p.content, 
      p.created_at, 
      u.username as author,
      COUNT(DISTINCT c.id) as comment_count,
      COALESCE(SUM(v.value), 0) as vote_score
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN comments c ON p.id = c.post_id
    LEFT JOIN votes v ON p.id = v.post_id
    GROUP BY p.id, u.username
    ORDER BY p.created_at DESC
  `) as Post[];

  // If user is logged in, get their votes on these posts
  let userVotes: { post_id: number; value: number }[] = [];

  if (user) {
    userVotes = (await sql`
      SELECT post_id, value
      FROM votes
      WHERE user_id = ${user.id} AND post_id IS NOT NULL
    `) as { post_id: number; value: number }[];
  }

  // Add user votes to posts
  const postsWithUserVotes = posts.map((post) => {
    if (user) {
      const userVote = userVotes.find((vote) => vote.post_id === post.id);
      return {
        ...post,
        userVote: userVote ? userVote.value : 0,
      };
    }
    return post;
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Latest Posts</h1>
        {user && (
          <Link href="/posts/new" passHref>
            <Button>Create Post</Button>
          </Link>
        )}
      </div>

      {postsWithUserVotes.length > 0 ? (
        postsWithUserVotes.map((post) => (
          <PostCard key={post.id} post={post} isAuthenticated={!!user} />
        ))
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
          <p className="text-muted-foreground mb-4">
            Be the first to create a post!
          </p>
          {user ? (
            <Link href="/posts/new" passHref>
              <Button>Create Post</Button>
            </Link>
          ) : (
            <Link href="/login" passHref>
              <Button>Login to Create Post</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
