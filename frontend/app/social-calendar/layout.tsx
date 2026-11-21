import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Magnanimous Social Publishing Calendar",
  robots: { index: false, follow: false },
};

export default function SocialCalendarLayout({ children }: { children: ReactNode }) {
  return children;
}
