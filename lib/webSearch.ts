/**
 * Real internet search used by the linguistic AI agent to ground its word
 * analysis in verifiable online sources. Uses the DuckDuckGo HTML endpoint —
 * no API key required. Returns [] gracefully on any failure.
 */

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
}

const SEARCH_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function decodeDdgUrl(href: string): string {
  try {
    if (href.includes('uddg=')) {
      return decodeURIComponent(href.split('uddg=')[1].split('&')[0]);
    }
  } catch {
    // fall through
  }
  return href;
}

export async function searchWeb(query: string, maxResults = 5): Promise<WebSearchResult[]> {
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: { 'User-Agent': SEARCH_UA, 'Accept-Language': 'ar,en;q=0.8' },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return [];

    const html = await res.text();
    const results: WebSearchResult[] = [];
    const blockRe =
      /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/gi;

    let match: RegExpExecArray | null;
    while ((match = blockRe.exec(html)) !== null && results.length < maxResults) {
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      const snippet = match[3].replace(/<[^>]+>/g, '').trim();
      if (title) {
        results.push({ title, snippet, url: decodeDdgUrl(match[1]) });
      }
    }
    return results;
  } catch {
    return [];
  }
}
