import { type NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import type { Vote } from "@/lib/types";

// Create or update a vote
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { postId, commentId, value } = await request.json();

    if ((!postId && !commentId) || (postId && commentId)) {
      return NextResponse.json(
        { error: "Either postId or commentId must be provided, but not both" },
        { status: 400 }
      );
    }

    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        { error: "Value must be 1 (upvote) or -1 (downvote)" },
        { status: 400 }
      );
    }

    // Check if user has already voted on this post/comment
    const existingVote = (await sql`
      SELECT id, value
      FROM votes
      WHERE user_id = ${user.id}
        AND ${
          postId ? sql`post_id = ${postId}` : sql`comment_id = ${commentId}`
        }
    `) as Vote[];

    if (existingVote.length > 0) {
      // If the vote is the same, remove it (toggle off)
      if (existingVote[0].value === value) {
        await sql`
          DELETE FROM votes
          WHERE id = ${existingVote[0].id}
        `;

        // Return new vote count
        const [newScore] = await sql`
          SELECT COALESCE(SUM(value), 0) as vote_score
          FROM votes
          WHERE ${
            postId ? sql`post_id = ${postId}` : sql`comment_id = ${commentId}`
          }
        `;

        return NextResponse.json({
          voteScore: newScore.vote_score,
          userVote: 0,
        });
      }

      // Update existing vote
      await sql`
        UPDATE votes
        SET value = ${value}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingVote[0].id}
      `;
    } else {
      // Create new vote
      await sql`
        INSERT INTO votes (value, post_id, comment_id, user_id)
        VALUES (
          ${value},
          ${postId || null},
          ${commentId || null},
          ${user.id}
        )
      `;
    }

    // Return new vote count
    const [newScore] = await sql`
      SELECT COALESCE(SUM(value), 0) as vote_score
      FROM votes
      WHERE ${
        postId ? sql`post_id = ${postId}` : sql`comment_id = ${commentId}`
      }
    `;

    return NextResponse.json({
      voteScore: newScore.vote_score,
      userVote: value,
    });
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
