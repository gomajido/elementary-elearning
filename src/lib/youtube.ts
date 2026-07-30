/** Parses youtube.com/watch, youtu.be, and youtube.com/embed URLs into an embeddable URL; null if unparseable. */
export function toYoutubeEmbedUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");
  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = parsed.pathname.slice(1);
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    if (parsed.pathname === "/watch") {
      videoId = parsed.searchParams.get("v");
    } else if (parsed.pathname.startsWith("/embed/")) {
      videoId = parsed.pathname.slice("/embed/".length);
    }
  }

  if (!videoId) return null;
  videoId = videoId.split("/")[0].split("?")[0];
  return `https://www.youtube.com/embed/${videoId}`;
}
