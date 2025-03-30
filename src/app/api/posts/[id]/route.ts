import { type NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { Post, Comment } from "@/lib/types";

// Get a single post with comments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = Number.parseInt(params.id, 10);

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
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
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

    // Get current user to check if they've voted on this post or comments
    const currentUser = await getCurrentUser();

    if (currentUser) {
      // Get user's vote on this post
      const [postVote] = await sql`
        SELECT value
        FROM votes
        WHERE user_id = ${currentUser.id} AND post_id = ${postId}
      `;

      // Get user's votes on these comments
      const commentVotes = (await sql`
        SELECT comment_id, value
        FROM votes
        WHERE user_id = ${currentUser.id} AND comment_id IN (${comments.map(
        (c) => c.id
      )})
      `) as { comment_id: number; value: number }[];

      // Add user's vote to post
      post.userVote = postVote ? postVote.value : 0;

      // Add user's votes to comments
      const commentsWithUserVotes = comments.map((comment: Comment) => {
        const userVote = commentVotes.find(
          (vote) => vote.comment_id === comment.id
        );
        return {
          ...comment,
          userVote: userVote ? userVote.value : 0,
        };
      });

      return NextResponse.json({ post, comments: commentsWithUserVotes });
    }

    return NextResponse.json({ post, comments });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}
