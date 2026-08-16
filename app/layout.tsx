import type { Metadata, Viewport } from "next";
import { AppStateProvider } from "@/lib/AppState";
import Rail from "@/components/Rail";
import ContentFrame from "@/components/ContentFrame";
import NewEventModal from "@/components/NewEventModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lucky Table",
  description: "家味開運桌 — the family kitchen dashboard."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" />
      </head>
      <body
        className="app-shell"
        style={{
          background: "var(--page)",
          color: "var(--color-text)",
          fontFamily: "var(--font-body), 'Noto Sans TC', sans-serif"
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
