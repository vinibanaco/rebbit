import { neon } from "@neondatabase/serverless";

// Create a SQL client with the database URL
export const sql = neon(process.env.DATABASE_URL!);
