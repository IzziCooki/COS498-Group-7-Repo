/**
 * YouTube Search Module
 *
 * Searches YouTube for tutorial videos without requiring an API key.
 * Uses YouTube's public page to extract video results.
 */

const https = require('https');

/**
 * Fetch a URL and return the response body as a string.
 */
function fetchUrl(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PCPal/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        fetchUrl(res.headers.location, timeoutMs).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

/**
 * Search YouTube for videos matching a query.
 * Returns an array of video objects with id, title, url, thumbnail, and channel.
 *
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results (default 3)
 * @returns {Promise<Array<{id: string, title: string, url: string, thumbnail: string, channel: string}>>}
 */
async function searchVideos(query, maxResults = 3) {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const encoded = encodeURIComponent(query + ' tutorial for beginners');
  const searchUrl = `https://www.youtube.com/results?search_query=${encoded}`;

  try {
    const html = await fetchUrl(searchUrl);

    // YouTube embeds initial data as JSON in a script tag
    const dataMatch = html.match(/var ytInitialData\s*=\s*({.+?});\s*<\/script/s);
    if (!dataMatch) {
      // Fallback: extract video IDs from the HTML directly
      return extractVideoIdsFromHtml(html, query, maxResults);
    }

    try {
      const data = JSON.parse(dataMatch[1]);
      return extractVideosFromData(data, maxResults);
    } catch {
      return extractVideoIdsFromHtml(html, query, maxResults);
    }
  } catch (err) {
    console.error('[youtubeSearch] Search failed:', err.message);
    // Return a search URL so the user can search manually
    return [{
      id: null,
      title: `Search YouTube for: ${query}`,
      url: searchUrl,
      thumbnail: null,
      channel: 'YouTube',
    }];
  }
}

/**
 * Extract videos from YouTube's ytInitialData JSON structure.
 */
function extractVideosFromData(data, maxResults) {
  const videos = [];

  const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
    ?.sectionListRenderer?.contents;

  if (!contents) return [];

  for (const section of contents) {
    const items = section?.itemSectionRenderer?.contents;
    if (!items) continue;

    for (const item of items) {
      const renderer = item?.videoRenderer;
      if (!renderer || !renderer.videoId) continue;

      const videoId = renderer.videoId;
      const title = renderer.title?.runs?.[0]?.text || 'Untitled video';
      const channel = renderer.ownerText?.runs?.[0]?.text || 'Unknown channel';

      videos.push({
        id: videoId,
        title,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        channel,
      });

      if (videos.length >= maxResults) break;
    }
    if (videos.length >= maxResults) break;
  }

  return videos;
}

/**
 * Fallback: extract video IDs from raw HTML using regex.
 */
function extractVideoIdsFromHtml(html, query, maxResults) {
  const videos = [];
  const seen = new Set();

  // Match video IDs from watch URLs in the HTML
  const regex = /\/watch\?v=([\w-]{11})/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const videoId = match[1];
    if (seen.has(videoId)) continue;
    seen.add(videoId);

    videos.push({
      id: videoId,
      title: `Video about: ${query}`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      channel: 'YouTube',
    });

    if (videos.length >= maxResults) break;
  }

  return videos;
}

module.exports = { searchVideos };
