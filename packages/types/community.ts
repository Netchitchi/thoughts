export interface Group {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export type PostType = 'discussion' | 'feedback' | 'article_share' | 'question';

export interface CommunityPost {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  type: PostType;
  article_id?: string | null;
  
  // Joined fields
  author?: {
    name: string;
    avatar_url: string;
  };
  group?: {
    name: string;
    image_url: string;
  };
  article?: {
    article_id: string;
    title: string;
    summary: string;
    cover_url: string | null;
  } | null;

  // Interaction data
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
}
