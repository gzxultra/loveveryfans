/**
 * Breadcrumb — Visual breadcrumb navigation for detail pages.
 * Improves both UX (users know where they are) and SEO (structured navigation).
 */
import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const { t } = useLanguage();

  return (
    <nav
      aria-label={t("面包屑导航", "Breadcrumb")}
      className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto scrollbar-hide py-1"
    >
      <Link href="/">
        <span className="inline-flex items-center gap-1 hover:text-foreground transition-colors whitespace-nowrap">
          <Home className="w-3 h-3" />
          <span className="hidden sm:inline">{t("首页", "Home")}</span>
        </span>
      </Link>
      {items.map((item, idx) => (
        <span key={idx} className="inline-flex items-center gap-1">
          <ChevronRight className="w-3 h-3 shrink-0 text-border" />
          {item.href ? (
            <Link href={item.href}>
              <span className="hover:text-foreground transition-colors whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          ) : (
            <span className="text-foreground font-medium whitespace-nowrap truncate max-w-[200px]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
