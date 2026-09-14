import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/** Static HTML shell used by `expo export --platform web`. */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="zh-Hant">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <title>Lucky Table</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: "html,body,#root{height:100%;} body{margin:0;background:#dce2de;overflow:hidden;-webkit-font-smoothing:antialiased;} *{-webkit-tap-highlight-color:transparent;}" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
