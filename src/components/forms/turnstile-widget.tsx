"use client";

import { useRef, useState, useCallback } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void }
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/**
 * Explicit-render Turnstile widget — `sitekey` isn't known until the script
 * has loaded, and the token is single-use, so the parent resets the widget
 * (via the returned `resetRef`) after every submit attempt, success or fail.
 */
export function TurnstileWidget({
  onToken,
  resetRef,
}: {
  onToken: (token: string | null) => void;
  resetRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  const render = useCallback(() => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: (token) => onToken(token),
    });
    setReady(true);
    if (resetRef) {
      resetRef.current = () => {
        onToken(null);
        if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
      };
    }
  }, [onToken, resetRef]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={render}
      />
      <div ref={containerRef} />
      {!ready && <p className="text-xs text-muted-foreground">Memuat verifikasi keamanan…</p>}
    </>
  );
}
