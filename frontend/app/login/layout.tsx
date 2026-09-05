import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in securely to your I AM MAGNANIMOUS WAY™ workspace.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
