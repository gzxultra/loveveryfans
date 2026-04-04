/**
 * SearchBar component
 *
 * Full-site search powered by FlexSearch.
 * Supports Chinese and English queries.
 * Results are grouped into: Kits / Alternatives / Blog posts.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ExternalLink, BookOpen, ShoppingCart, FileText } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildSearchIndex, search as searchIndex } from "@/lib/search";
import type { SearchResult, GroupedSearchResults } from "@/lib/search";
import { kits } from "@/data/kits";
import { alternatives } from "@/data/alternatives";
import { blogPosts } from "@/data/blogPosts";

// Build the index once when this module loads
let indexInitialized = false;
function ensureIndex() {
  if (indexInitialized) return;
  buildSearchIndex(kits, alternatives, blogPosts);
  indexInitialized = true;
}

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onClose?: () => void;
}

function ResultItem({ result, lang, onSelect }: {
  result: SearchResult;
  lang: string;
  onSelect: () => void;
}) {
  const title = lang === "cn" ? result.title : result.titleEn;
  const subtitle = lang === "cn" ? result.subtitle : result.subtitleEn;
  const isExternal = result.url.startsWith("http");

  const content = (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-[#F5F0EB] transition-colors cursor-pointer group">
      <div className="mt-0.5 shrink-0">
        {result.type === "kit" && (
          <div className="w-7 h-7 rounded-lg bg-[#7FB685]/15 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-[#5a9e65]" />
          </div>
        )}
        {result.type === "alternative" && (
          <div className="w-7 h-7 rounded-lg bg-[#E8A87C]/15 flex items-center justify-center">
            <ShoppingCart className="w-3.5 h-3.5 text-[#c47a3a]" />
          </div>
        )}
        {result.type === "blog" && (
          <div className="w-7 h-7 rounded-lg bg-[#7B9EC4]/15 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-[#4a7aaa]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1a1108] truncate group-hover:text-[#3D3229]">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-[#756A5C] truncate mt-0.5">{subtitle}</p>
        )}
      </div>
      {isExternal && (
        <ExternalLink className="w-3.5 h-3.5 text-[#9A8E82] shrink-0 mt-1" />
      )}
    </div>
  );

  if (isExternal) {
    return (
      <a href={result.url} target="_blank" rel="noopener noreferrer" onClick={onSelect}>
        {content}
      </a>
    );
  }

  return (
    <Link href={result.url} onClick={onSelect}>
      {content}
    </Link>
  );
}

function ResultGroup({ title, results, lang, onSelect }: {
  title: string;
  results: SearchResult[];
  lang: string;
  onSelect: () => void;
}) {
  if (results.length === 0) return null;

  return (
    <div>
      <div className="px-4 py-2 bg-[#FAF7F2] border-b border-[#E8DFD3]">
        <p className="text-xs font-semibold text-[#756A5C] uppercase tracking-wide">{title}</p>
      </div>
      {results.map((result) => (
        <ResultItem key={result.id} result={result} lang={lang} onSelect={onSelect} />
      ))}
    </div>
  );
}

export default function SearchBar({ className = "", placeholder, onClose }: SearchBarProps) {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedSearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultPlaceholder = placeholder || t("搜索 Kit、玩具、替代品…", "Search kits, toys, alternatives…");

  // Initialize index on first interaction
  const handleFocus = useCallback(() => {
    ensureIndex();
    setIsOpen(true);
  }, []);

  // Search as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    ensureIndex();
    const r = searchIndex(query, 15);
    setResults(r);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    onClose?.();
  }, [onClose]);

  const handleClear = useCallback(() => {
    setQuery("");
    setResults(null);
    inputRef.current?.focus();
  }, []);

  const showDropdown = isOpen && query.trim().length > 0;
  const hasResults = results && results.total > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-[#9A8E82] pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder={defaultPlaceholder}
          className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-[#E8DFD3] rounded-full
            focus:outline-none focus:ring-2 focus:ring-[#7FB685]/30 focus:border-[#7FB685]
            placeholder:text-[#B8AFA3] text-[#3D3229] transition-all"
          aria-label={defaultPlaceholder}
          autoComplete="off"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 text-[#9A8E82] hover:text-[#3D3229] transition-colors"
            aria-label={t("清除搜索", "Clear search")}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[#E8DFD3] shadow-xl shadow-[#3D3229]/10 z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
          {hasResults ? (
            <>
              <ResultGroup
                title={t("Play Kit", "Play Kits")}
                results={results!.kits}
                lang={lang}
                onSelect={handleSelect}
              />
              <ResultGroup
                title={t("Amazon 替代品", "Amazon Alternatives")}
                results={results!.alternatives}
                lang={lang}
                onSelect={handleSelect}
              />
              <ResultGroup
                title={t("博客文章", "Blog Posts")}
                results={results!.blogs}
                lang={lang}
                onSelect={handleSelect}
              />
              <div className="px-4 py-2 border-t border-[#E8DFD3] bg-[#FAF7F2]">
                <p className="text-xs text-[#9A8E82]">
                  {t(`找到 ${results!.total} 个结果`, `${results!.total} results found`)}
                </p>
              </div>
            </>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-[#9A8E82]">
                {t(`没有找到 "${query}" 的相关结果`, `No results found for "${query}"`)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
