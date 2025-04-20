export interface INews {
  id: string;
  source: string;
  headline: string;
  assets: string[];
  link: string;
  keywords: string[];
  timestamp: number;
}

export interface INewsFilters {
  keywords: Set<string>;
  assets: Set<string>;
  sources: Set<string>;
}
