/**
 * TableOfContents — A floating/sticky table of contents for Kit detail pages.
 * Shows toy names as navigation anchors, highlighting the currently visible one.
 * Only visible on desktop (lg+) as a sidebar element.
 */
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  label: string;
  index: number;
}

interface TableOfContentsProps {
  items: TocItem[];
  color?: string;
}

export default function TableOfContents({ items, color = "#7FB685" }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();

  const handleScroll = useCallback(() => {
    const scrollPos = window.scrollY + 120;
    let currentId = "";

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el && el.offsetTop <= scrollPos) {
        currentId = item.id;
      }
    }

    setActiveId(currentId);
  }, [items]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToItem = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (items.length < 3) return null;

  return (
    <div className="hidden xl:block fixed right-4 2xl:right-8 top-1/2 -translate-y-1/2 z-30 max-h-[70vh]">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-[#E8DFD3] shadow-lg shadow-[#3D3229]/5 overflow-hidden transition-all duration-300">
        {/* Toggle header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-[#6B5E50] hover:text-[#3D3229] transition-colors"
        >
          <List className="w-3.5 h-3.5" />
          <span>{t("目录", "Contents")}</span>
          <span className="ml-auto text-[10px] text-[#B0A89E]">{items.length}</span>
        </button>

        {/* Items list */}
        {!isCollapsed && (
          <div className="max-h-[55vh] overflow-y-auto px-1 pb-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToItem(item.id)}
                className={`w-full text-left px-3 py-1.5 text-[11px] leading-tight rounded-md transition-all duration-200 block ${
                  activeId === item.id
                    ? "font-medium"
                    : "text-[#756A5C] hover:text-[#3D3229] hover:bg-[#FAF7F2]"
                }`}
                style={
                  activeId === item.id
                    ? { color: color, backgroundColor: color + "10" }
                    : undefined
                }
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-1 h-1 rounded-full shrink-0 transition-colors"
                    style={{ backgroundColor: activeId === item.id ? color : "#C8BFB3" }}
                  />
                  <span className="truncate max-w-[140px]">{item.label}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
