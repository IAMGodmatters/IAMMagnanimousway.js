export type MagnanimousMode =
  | "General"
  | "Business"
  | "Social Media"
  | "Virtual Assistant"
  | "Research"
  | "Writing";

export const MODE_OPTIONS: MagnanimousMode[] = [
  "General",
  "Business",
  "Social Media",
  "Virtual Assistant",
  "Research",
  "Writing",
];

export const MODE_VISUALS = {
  General: {
    image: "/mode-images/general.webp",
    themeClass: "mode-theme-general",
    accent: "#7fb6ff",
    title: "Magnanimous AI",
    subtitle: "General help, guidance, ideas and conversation.",
  },
  Business: {
    image: "/mode-images/business.webp",
    themeClass: "mode-theme-business",
    accent: "#8ee3a1",
    title: "Business Command",
    subtitle: "Plans, operations, growth, strategy and execution.",
  },
  "Social Media": {
    image: "/mode-images/social-media.webp",
    themeClass: "mode-theme-social",
    accent: "#ff87dc",
    title: "Social Studio",
    subtitle: "Content, creativity, campaigns and audience growth.",
  },
  "Virtual Assistant": {
    image: "/mode-images/virtual-assistant.webp",
    themeClass: "mode-theme-assistant",
    accent: "#7ff0d8",
    title: "Virtual Assistant",
    subtitle: "Tasks, follow-up, organization and daily support.",
  },
  Research: {
    image: "/mode-images/research.webp",
    themeClass: "mode-theme-research",
    accent: "#7aa7ff",
    title: "Research Center",
    subtitle: "Explore, question, analyze and synthesize information.",
  },
  Writing: {
    image: "/mode-images/writing.webp",
    themeClass: "mode-theme-writing",
    accent: "#d39bff",
    title: "Writing Studio",
    subtitle: "Draft, refine, publish and communicate clearly.",
  },
} as const satisfies Record<
  MagnanimousMode,
  {
    image: string;
    themeClass: string;
    accent: string;
    title: string;
    subtitle: string;
  }
>;

export function normalizeMode(input: string): MagnanimousMode {
  const value = String(input || "").trim().toLowerCase();
  if (value === "business") return "Business";
  if (value === "social media" || value === "social") return "Social Media";
  if (value === "virtual assistant" || value === "assistant")
    return "Virtual Assistant";
  if (value === "research") return "Research";
  if (value === "writing") return "Writing";
  return "General";
}
