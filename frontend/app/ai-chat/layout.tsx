import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Magnanimous AI Modes",
  description:
    "Enter a specialized Magnanimous AI workspace for general guidance, business, social media, virtual assistance, research or writing.",
};

export default function AIChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
