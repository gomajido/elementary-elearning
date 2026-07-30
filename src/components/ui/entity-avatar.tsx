import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { contentObjectUrl } from "@/lib/storage/client";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function EntityAvatar({
  storageKey,
  name,
  size = "default",
  updatedAt,
}: {
  storageKey?: string | null;
  name: string;
  size?: "default" | "sm" | "lg";
  updatedAt?: Date | string | number | null;
}) {
  return (
    <Avatar size={size}>
      {storageKey && <AvatarImage src={contentObjectUrl(storageKey, updatedAt)} alt={name} />}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
