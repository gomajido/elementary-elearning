"use client";

import { useTransition } from "react";

import { publishCourseAction } from "@/server/controllers/course-controller";
import { Button } from "@/components/ui/button";

export function PublishCourseButton({ courseId, isPublished }: { courseId: string; isPublished: boolean }) {
  const [pending, startTransition] = useTransition();

  if (isPublished) return null;

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => publishCourseAction(courseId))}
    >
      {pending ? "Publishing…" : "Publish course"}
    </Button>
  );
}
