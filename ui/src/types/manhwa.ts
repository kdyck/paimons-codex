export interface Manhwa {
  id: string;
  title: string;
  author: string;
  genre: string[];
  status: string;
  description: string;
  cover_image?: string;  // optional override
  slug: string;          // e.g., "no-more-princes"
}

export interface SearchResult extends Manhwa {
  relevance_score: number;
  snippet: string;
}