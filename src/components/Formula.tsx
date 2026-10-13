import { useEffect, useState } from "react";

type Katex = { renderToString: (tex: string, o?: Record<string, unknown>) => string };
let loading: Promise<Katex> | null = null;

/** KaTeX is bundled, not fetched from a CDN, and only loaded once a formula is on screen. */
function katex(): Promise<Katex> {
  loading ??= Promise.all([import("katex"), import("katex/dist/katex.min.css")]).then(([k]) => (k.default ?? k) as Katex);
  return loading;
}

/** A formula typeset with KaTeX; the plain-text form stands in until KaTeX is ready (and if it fails). */
export function Formula({ tex, text, className }: { tex?: string; text: string; className?: string }) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    if (!tex) {
      setHtml(null);
      return;
    }
    let on = true;
    katex()
      .then((k) => {
        if (on) setHtml(k.renderToString(tex, { throwOnError: false, strict: "ignore" }));
      })
      .catch(() => {
        if (on) setHtml(null);
      });
    return () => {
      on = false;
    };
  }, [tex]);
  if (html) return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  return <span className={className}>{text}</span>;
}
