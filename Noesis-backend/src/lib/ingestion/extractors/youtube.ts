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
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Scrapes the video title and extracts transcripts (captions) using youtube-transcript.
 */
export async function extractYoutube(url: string): Promise<YoutubeContent> {
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
