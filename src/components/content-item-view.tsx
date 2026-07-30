import { presignDownload } from "@/lib/storage/client";
import { toYoutubeEmbedUrl } from "@/lib/youtube";
import type { courseContentItems } from "@/lib/db/schema";

type ContentItem = typeof courseContentItems.$inferSelect;

export async function ContentItemView({ item }: { item: ContentItem }) {
  if (item.type === "video" && item.externalUrl) {
    const embedUrl = toYoutubeEmbedUrl(item.externalUrl);
    if (embedUrl) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-md">
          <iframe src={embedUrl} className="h-full w-full" allowFullScreen title={item.title} />
        </div>
      );
    }
    return (
      <a href={item.externalUrl} target="_blank" rel="noreferrer" className="block underline underline-offset-4">
        {item.externalUrl}
      </a>
    );
  }

  if (item.type === "pdf" && item.r2Key) {
    const downloadUrl = await presignDownload(item.r2Key);
    return (
      <a href={downloadUrl} target="_blank" rel="noreferrer" className="block underline underline-offset-4">
        Buka PDF
      </a>
    );
  }

  if (item.type === "note" && item.bodyMarkdown) {
    return <p className="whitespace-pre-wrap text-muted-foreground">{item.bodyMarkdown}</p>;
  }

  if (item.type === "link" && item.externalUrl) {
    return (
      <a href={item.externalUrl} target="_blank" rel="noreferrer" className="block underline underline-offset-4">
        {item.externalUrl}
      </a>
    );
  }

  return null;
}
