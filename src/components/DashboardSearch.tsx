import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { searchItems } from "@/lib/searchItems";

type Ctx = { query: string; setQuery: (q: string) => void; setEnabled: (v: boolean) => void; enabled: boolean };
const SearchContext = createContext<Ctx | null>(null);

export const DashboardSearchProvider = ({ children }: { children: ReactNode }) => {
  const [query, setQuery] = useState("");
  const [enabled, setEnabled] = useState(false);
  return <SearchContext.Provider value={{ query, setQuery, enabled, setEnabled }}>{children}</SearchContext.Provider>;
};

/** Pages call this to show the search box and filter their lists. */
export const useDashboardSearch = () => {
  const ctx = useContext(SearchContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setEnabled(true);
    return () => { ctx.setEnabled(false); ctx.setQuery(""); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const query = ctx?.query ?? "";
  return <T,>(items: T[] | null | undefined): T[] => searchItems(items ?? [], query);
};

export const DashboardSearchBox = () => {
  const ctx = useContext(SearchContext);
  if (!ctx?.enabled) return null;
  return <SearchInput value={ctx.query} onChange={ctx.setQuery} className="mb-6" />;
};

export const SearchInput = ({ value, onChange, className = "", placeholder = "ابحث هنا…" }: { value: string; onChange: (v: string) => void; className?: string; placeholder?: string }) => (
  <div className={`relative w-full max-w-md ${className}`}>
    <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label="بحث"
      className="h-11 w-full rounded-full border border-border bg-card pr-10 pl-10 text-sm text-foreground shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 [&::-webkit-search-cancel-button]:hidden"
    />
    {value && (
      <button type="button" onClick={() => onChange("")} aria-label="مسح البحث" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
);
