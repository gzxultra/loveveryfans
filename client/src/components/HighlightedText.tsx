/**
 * HighlightedText — renders text with highlighted matching portions.
 */

import { highlightMatch } from "@/hooks/useFuzzySearch";

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

export default function HighlightedText({ text, query, className }: HighlightedTextProps) {
  const segments = highlightMatch(text, query);

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark
            key={i}
            className="bg-[#7FB685]/20 text-inherit rounded-sm px-0.5"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  );
}
