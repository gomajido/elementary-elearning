"use client";

import { useTransition } from "react";

import { publishQuizAction } from "@/server/controllers/quiz-controller";
import { Button } from "@/components/ui/button";

export function PublishQuizButton({ quizId, isPublished }: { quizId: string; isPublished: boolean }) {
  const [pending, startTransition] = useTransition();

  if (isPublished) return null;

  return (
    <Button size="sm" disabled={pending} onClick={() => startTransition(() => publishQuizAction(quizId))}>
      {pending ? "Publishing…" : "Publish quiz"}
    </Button>
  );
}
