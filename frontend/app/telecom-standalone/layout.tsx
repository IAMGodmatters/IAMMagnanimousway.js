import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Magnanimous Telecom",
  description:
    "Standalone Magnanimous Telecom entrance powered by the shared Magnanimous AI brain and telecom backend.",
};

export default function TelecomStandaloneLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
            document.documentElement.setAttribute('data-iam-standalone','true');
          })();`,
        }}
      />
      {children}
    </>
  );
}
