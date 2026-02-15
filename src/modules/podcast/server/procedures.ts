import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";

const SPOTIFY_MARKET = "ID";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

function getShowId(): string {
  const showId = process.env.SPOTIFY_SHOW_ID;
  if (!showId) {
    throw new Error("SPOTIFY_SHOW_ID not configured");
  }
  return showId;
}

async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Spotify token request failed: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return cachedToken!;
}

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  html_description: string;
  release_date: string;
  duration_ms: number;
  external_urls: { spotify: string };
  images: SpotifyImage[];
}

interface SpotifyEpisodesResponse {
  items: SpotifyEpisode[];
  total: number;
  limit: number;
  offset: number;
}

function mapEpisode(ep: SpotifyEpisode) {
  return {
    id: ep.id,
    name: ep.name,
    description: ep.description,
    releaseDate: ep.release_date,
    durationMs: ep.duration_ms,
    spotifyUrl: ep.external_urls.spotify,
    images: ep.images,
  };
}

export const podcastRouter = createTRPCRouter({
  getEpisodes: baseProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(11),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 11;
      const offset = input?.offset ?? 0;
      const token = await getSpotifyToken();
      const showId = getShowId();
      const url = `${API_BASE}/shows/${encodeURIComponent(showId)}/episodes?market=${SPOTIFY_MARKET}&limit=${limit}&offset=${offset}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${response.status} ${errorText}`);
      }

      const data: SpotifyEpisodesResponse = await response.json();

    return {
      episodes: data.items.map(mapEpisode),
      total: data.total,
    };
  }),

  getLatestEpisode: baseProcedure.query(async () => {
    const token = await getSpotifyToken();
    const showId = getShowId();
    const url = `${API_BASE}/shows/${encodeURIComponent(showId)}/episodes?market=${SPOTIFY_MARKET}&limit=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Spotify API error: ${response.status} ${errorText}`);
    }

    const data: SpotifyEpisodesResponse = await response.json();

    if (data.items.length === 0) {
      return null;
    }

    return mapEpisode(data.items[0]);
  }),
});
