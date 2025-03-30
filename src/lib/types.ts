export type User = {
  id: number;
  username: string;
  email: string;
};

export type Post = {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  comment_count: number;
  vote_score: number;
  userVote?: number;
};

export type Comment = {
  id: number;
  content: string;
  author: string;
  created_at: string;
  vote_score: number;
  userVote?: number;
};

export type Vote = {
  id: number;
  value: number;
  post_id?: number;
  comment_id?: number;
  user_id: number;
};
