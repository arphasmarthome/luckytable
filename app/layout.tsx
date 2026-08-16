import type { Metadata } from "next";
import { AppStateProvider } from "@/lib/AppState";
import Rail from "@/components/Rail";
import ContentFrame from "@/components/ContentFrame";
import NewEventModal from "@/components/NewEventModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lucky Table",
  description: "家味開運桌 — the family kitchen dashboard."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" />
      </head>
      <body
        style={{
          width: "100%",
          height: "100vh",
          background: "var(--page)",
          color: "var(--color-text)",
          fontFamily: "var(--font-body), 'Noto Sans TC', sans-serif",
          display: "flex",
          flexDirection: "row",
          overflow: "hidden"
        }}
      >
        <AppStateProvider>
          <Rail />
          <ContentFrame>{children}</ContentFrame>
          <NewEventModal />
        </AppStateProvider>
      </body>
    </html>
  );
}
