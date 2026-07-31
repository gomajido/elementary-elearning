// Fixed, Tailwind-scannable class strings — a template literal like
// `bg-${color}-500` wouldn't be picked up by Tailwind's static analysis.
// Shared between StudentShell (nav) and PlayfulStatTile so the same color
// vocabulary is used across the student portal's chrome and content.
export const PLAYFUL_COLORS = {
  sky: {
    solid: "bg-sky-500 text-white",
    soft: "bg-sky-100 text-sky-600",
  },
  violet: {
    solid: "bg-violet-500 text-white",
    soft: "bg-violet-100 text-violet-600",
  },
  amber: {
    solid: "bg-amber-500 text-white",
    soft: "bg-amber-100 text-amber-600",
  },
  rose: {
    solid: "bg-rose-500 text-white",
    soft: "bg-rose-100 text-rose-600",
  },
} as const;

export type PlayfulColor = keyof typeof PLAYFUL_COLORS;
