/**
 * Passes raw text straight through.
 */
export async function extractText(content: string): Promise<string> {
  return content || "";
}
