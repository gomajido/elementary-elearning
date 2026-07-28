// Single source of truth for landing-page branding content. No CMS for
// MVP (RFC 0001) — edit this file directly when copy needs to change.
export const schoolConfig = {
  name: "Madani Elementary School",
  tagline: "Nurturing curious minds, one step at a time.",
  about:
    "Madani Elementary School is dedicated to giving every child a strong academic foundation in a caring, supportive environment where curiosity is encouraged and every student is known by name.",
  programs: [
    { name: "Kindergarten / Reception", description: "Foundational literacy, numeracy, and social skills." },
    { name: "Primary 1 - 3", description: "Core subjects with a focus on reading, writing, and arithmetic." },
    { name: "Primary 4 - 6", description: "Expanded curriculum preparing students for secondary school." },
  ],
  contact: {
    address: "Add school address here",
    phone: "Add phone number here",
    email: "info@example.com",
  },
} as const;
