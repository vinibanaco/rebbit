import { type NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import type { Post } from "@/lib/types";

// Get all posts
export async function GET() {
  try {
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

    // Get current user to check if they've voted on these posts
    const currentUser = await getCurrentUser();

    if (currentUser) {
      // Get user's votes on these posts
      const userVotes = (await sql`
        SELECT post_id, value
        FROM votes
        WHERE user_id = ${currentUser.id} AND post_id IS NOT NULL
      `) as { post_id: number; value: number }[];

      // Map user votes to posts
      const postsWithUserVotes = posts.map((post: Post) => {
        const userVote = userVotes.find((vote) => vote.post_id === post.id);
        return {
          ...post,
          userVote: userVote ? userVote.value : 0,
        };
      });

      return NextResponse.json(postsWithUserVotes);
    }

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// Create a new post
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { title, content } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [newPost] = await sql`
      INSERT INTO posts (title, content, user_id)
      VALUES (${title}, ${content}, ${user.id})
      RETURNING id, title, content, created_at
    `;

    return NextResponse.json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
