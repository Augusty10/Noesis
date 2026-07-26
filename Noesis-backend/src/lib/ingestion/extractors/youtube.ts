import { YoutubeTranscript } from "youtube-transcript";
import * as cheerio from "cheerio";

export interface YoutubeContent {
  videoId: string;
  title: string;
  cues: { text: string; startTime: number; endTime: number }[];
}

/**
 * Extracts YouTube Video ID from standard watch links, share links, or embeds.
 */
export function extractVideoId(url: string): string | null {
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/|live\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

/**
 * Extracts YouTube Playlist ID from a playlist URL if present.
 */
export function extractPlaylistId(url: string): string | null {
  const match = url.match(/[&?]list=([^&]+)/);
  return match ? match[1] : null;
}

/**
 * Scrapes the video title and extracts transcripts (captions) using youtube-transcript.
 * Supports individual videos and playlists (merging up to 10 videos).
 */
export async function extractYoutube(url: string): Promise<YoutubeContent> {
  const playlistId = extractPlaylistId(url);
  if (playlistId) {
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    const response = await fetch(playlistUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist page. Status: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const pageTitle = $("title").text().trim().replace(/ - YouTube$/, "");
    const title = pageTitle || `YouTube Playlist (${playlistId})`;

    const videoIdsSet = new Set<string>();
    const matches = html.matchAll(/"videoId":"([^"]{11})"/g);
    for (const match of matches) {
      videoIdsSet.add(match[1]);
    }
    const videoIds = Array.from(videoIdsSet);

    if (videoIds.length === 0) {
      throw new Error("No video IDs found in the playlist. Make sure it is public.");
    }

    const cues: { text: string; startTime: number; endTime: number }[] = [];
    const maxVideos = Math.min(videoIds.length, 10);
    for (let i = 0; i < maxVideos; i++) {
      const vId = videoIds[i];
      try {
        const transcriptList = await YoutubeTranscript.fetchTranscript(vId);
        const offset = cues.length > 0 ? cues[cues.length - 1].endTime + 10 : 0;
        
        for (const item of transcriptList) {
          const isMs = item.offset > 5000;
          const startTime = isMs ? item.offset / 1000 : item.offset;
          const duration = isMs ? item.duration / 1000 : item.duration;
          cues.push({
            text: item.text,
            startTime: startTime + offset,
            endTime: startTime + duration + offset,
          });
        }
      } catch (err) {
        console.warn(`Skipping video ${vId} in playlist: ${(err as Error).message}`);
      }
    }

    if (cues.length === 0) {
      throw new Error("None of the videos in the playlist have captions enabled.");
    }

    return {
      videoId: videoIds[0],
      title,
      cues,
    };
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL. Could not extract video ID.");
  }

  // 1. Fetch title of video
  let title = `YouTube Video (${videoId})`;
  try {
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(videoPageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      const pageTitle = $("title").text().trim();
      if (pageTitle) {
        title = pageTitle.replace(/ - YouTube$/, "");
      }
    }
  } catch (err) {
    // Keep fallback title
  }

  // 2. Fetch transcript
  try {
    const transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
    const cues = transcriptList.map((item) => {
      // Bulletproof check for milliseconds vs seconds
      // youtube-transcript library might return offset in milliseconds or seconds depending on version
      const isMs = item.offset > 5000;
      const startTime = isMs ? item.offset / 1000 : item.offset;
      const duration = isMs ? item.duration / 1000 : item.duration;
      const endTime = startTime + duration;

      return {
        text: item.text,
        startTime,
        endTime,
      };
    });

    return { videoId, title, cues };
  } catch (err) {
    throw new Error(
      `Failed to fetch YouTube transcripts. Make sure captions/subtitles are enabled for this video. Details: ${(err as Error).message}`
    );
  }
}
