import { useEffect, useRef } from "react";

/**
 * Fires `onSuccess` exactly once when a useActionState-backed form action
 * transitions from pending to settled without an error. Not tied to the
 * action explicitly returning `{ success: true }` — several controller
 * actions in this codebase just return `{}` on success (see
 * fee-controller.ts's createFeeStructureAction) rather than setting that
 * flag, so gating on it would miss those. Gating on `!error` alone would be
 * wrong too — it'd fire immediately on mount, before any submission, since
 * the initial state also has no error. The pending→settled transition is
 * the one signal common to every action here.
 */
export function useActionSuccess(pending: boolean, error: string | undefined, onSuccess?: () => void) {
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !error) {
      onSuccess?.();
    }
    wasPending.current = pending;
  }, [pending, error, onSuccess]);
}
