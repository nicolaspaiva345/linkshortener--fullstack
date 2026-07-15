export interface ShortenUrlRequest {
  originalUrl: String;
}

export interface ShortenUrlResponse {
  shortUrl: string;
}

export interface UrlStatsResponse {
  originalUrl: string;
  clicks: number;
  createdAt: string;
}