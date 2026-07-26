import fs from "fs";

export interface VttCue {
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

/**
 * Parses VTT string content into structured cues with start and end times in seconds.
 */
export function parseVttContent(vttText: string): VttCue[] {
  const lines = vttText.replace(/\r\n/g, "\n").split("\n");
  const cues: VttCue[] = [];

  let currentCue: Partial<VttCue> | null = null;
  const timeRegex = /(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/;
  const timeRegexShort = /(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2})\.(\d{3})/;

  function timeToSeconds(h: string, m: string, s: string, ms: string): number {
    return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10) + parseInt(ms, 10) / 1000;
  }

  function timeToSecondsShort(m: string, s: string, ms: string): number {
    return parseInt(m, 10) * 60 + parseInt(s, 10) + parseInt(ms, 10) / 1000;
  }

  for (let line of lines) {
    line = line.trim();
    if (!line || line === "WEBVTT") {
      continue;
    }

    const match = line.match(timeRegex);
    const matchShort = line.match(timeRegexShort);

    if (match) {
      if (currentCue && currentCue.text) {
        cues.push(currentCue as VttCue);
      }
      currentCue = {
        startTime: timeToSeconds(match[1], match[2], match[3], match[4]),
        endTime: timeToSeconds(match[5], match[6], match[7], match[8]),
        text: "",
      };
    } else if (matchShort) {
      if (currentCue && currentCue.text) {
        cues.push(currentCue as VttCue);
      }
      currentCue = {
        startTime: timeToSecondsShort(matchShort[1], matchShort[2], matchShort[3]),
        endTime: timeToSecondsShort(matchShort[4], matchShort[5], matchShort[6]),
        text: "",
      };
    } else if (currentCue) {
      // Skip numeric cue IDs
      if (/^\d+$/.test(line)) {
        continue;
      }
      if (currentCue.text) {
        currentCue.text += " " + line;
      } else {
        currentCue.text = line;
      }
    }
  }

  if (currentCue && currentCue.text) {
    cues.push(currentCue as VttCue);
  }

  return cues;
}

/**
 * Extracts cues from a VTT file path.
 */
export async function extractVtt(filePath: string): Promise<VttCue[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  return parseVttContent(content);
}
