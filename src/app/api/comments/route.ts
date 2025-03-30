import { type NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import type { Comment } from "@/lib/types";

// Create a new comment
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { postId, content } = await request.json();

    if (!postId || !content) {
      return NextResponse.json(
        { error: "Post ID and content are required" },
        { status: 400 }
      );
    }

    const [newComment] = await sql`
      INSERT INTO comments (content, post_id, user_id)
      VALUES (${content}, ${postId}, ${user.id})
      RETURNING id, content, created_at
    `;

    // Get author username for the new comment
    const [commentWithAuthor] = (await sql`
      SELECT c.id, c.content, c.created_at, u.username as author
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ${newComment.id}
    `) as Comment[];

    return NextResponse.json(commentWithAuthor);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
