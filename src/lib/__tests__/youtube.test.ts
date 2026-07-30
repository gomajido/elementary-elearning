import { describe, it, expect } from "vitest";

import { toYoutubeEmbedUrl } from "@/lib/youtube";

describe("toYoutubeEmbedUrl", () => {
  it("parses a watch URL", () => {
    expect(toYoutubeEmbedUrl("https://www.youtube.com/watch?v=abc123XYZ_")).toBe(
      "https://www.youtube.com/embed/abc123XYZ_",
    );
  });

  it("parses a youtu.be short URL", () => {
    expect(toYoutubeEmbedUrl("https://youtu.be/abc123XYZ_")).toBe("https://www.youtube.com/embed/abc123XYZ_");
  });

  it("parses an already-embed URL", () => {
    expect(toYoutubeEmbedUrl("https://www.youtube.com/embed/abc123XYZ_")).toBe(
      "https://www.youtube.com/embed/abc123XYZ_",
    );
  });

  it("returns null for a non-YouTube URL", () => {
    expect(toYoutubeEmbedUrl("https://example.com/video.mp4")).toBeNull();
  });

  it("returns null for an unparseable string", () => {
    expect(toYoutubeEmbedUrl("not a url")).toBeNull();
  });
});
