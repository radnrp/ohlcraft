import { useEffect, useRef, useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  compact?: boolean;
}

export function CodeBlock({ code, language = "tsx", title, compact = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(code); }
    catch { return; }
    setCopied(true);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={`site-code-block ${compact ? "is-compact" : ""}`}>
      <div className="site-code-head">
        <div><span className="code-dots"><i /><i /><i /></span>{title && <strong>{title}</strong>}</div>
        <div><span>{language}</span><button type="button" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button></div>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}
