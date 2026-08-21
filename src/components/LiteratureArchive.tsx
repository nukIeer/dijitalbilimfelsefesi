"use client";

import React, {
  useEffect, useState, useMemo, useRef, useCallback,
} from "react";
import { Search, Loader2, ChevronDown, ExternalLink, Filter, BookOpen, Calendar, ArrowLeft, ArrowRight, Library, SlidersHorizontal, Settings2, BarChart2, FileText, CheckSquare, Square } from "lucide-react";
import { cn } from "../lib/utils";

// ── Tip tanımları ─────────────────────────────────────────────────────────────
interface Article {
  id        : string;
  title     : string;
  authors   : string;
  year      : number | null;
  abstract  : string;
  citations : number;
  score     : number;
}

type SortKey = "score" | "year" | "citations";
type SortOrder = "desc" | "asc";

const PAGE_SIZE = 20;

// ── Metinde arama terimini vurgula ────────────────────────────────────────────
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const rawQueries = query.split(/\s+/).filter(Boolean);
  if (rawQueries.length === 0) return <>{text}</>;
  
  const regex = new RegExp(`(${rawQueries.map(q => q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join('|')})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-[#8A1538] rounded-sm px-1 shadow-sm font-semibold selection:bg-yellow-300">
            {part}
          </mark>
        ) : part
      )}
    </>
  );
}

// ── Tek makale kartı ──────────────────────────────────────────────────────────
const ArticleCard = React.memo(function ArticleCard({
  article, query, expanded, onToggle,
}: {
  article  : Article;
  query    : string;
  expanded : boolean;
  onToggle : () => void;
}) {
  const openAlex = article.id.startsWith("http") ? article.id : `https://openalex.org/${article.id}`;

  return (
    <div
      className={cn(
        "group bg-white border rounded-xl p-5 md:p-6 cursor-pointer transition-all duration-300 transform",
        expanded 
          ? "border-[#8A1538]/40 shadow-md ring-2 ring-[#8A1538]/5 scale-[1.01]" 
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      )}
      onClick={onToggle}
    >
      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <div className="flex-1 min-w-0 pr-4">
          
          <div className="flex flex-wrap items-center gap-2 mb-3">
             {article.year && (
               <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 font-mono text-xs px-2.5 py-1 rounded-md font-semibold tracking-tight border border-gray-200 shadow-sm">
                 <Calendar className="w-3.5 h-3.5 text-gray-500" />
                 {article.year}
               </span>
             )}
             <span className={cn(
               "inline-flex items-center gap-1.5 font-sans text-xs px-2.5 py-1 rounded-md font-semibold border shadow-sm",
               article.citations > 100 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-[#8A1538] border-rose-100"
             )}>
                <BookOpen className="w-3.5 h-3.5" />
                {article.citations.toLocaleString("tr-TR")} Atıf
             </span>
             {article.score > 80 && (
                <span className="inline-flex items-center gap-1.5 bg-[#8A1538]/5 text-[#8A1538] font-sans text-xs px-2.5 py-1 rounded-md font-bold border border-[#8A1538]/10 shadow-sm">
                  Önem Yüksek
                </span>
             )}
          </div>

          <h3 className="text-xl md:text-2xl font-serif leading-tight text-gray-900 group-hover:text-[#8A1538] transition-colors mb-2">
            <Highlight text={article.title} query={query} />
          </h3>
          
          {article.authors && (
            <p className="text-sm font-medium text-gray-500 leading-relaxed font-sans">
              <Highlight text={
                article.authors.length > 150
                  ? article.authors.slice(0, 150) + "…"
                  : article.authors
              } query={query} />
            </p>
          )}

        </div>

        <div className={cn(
          "shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border shadow-sm",
          expanded ? "bg-[#8A1538] border-[#8A1538] text-white rotate-180" : "bg-white border-gray-200 text-gray-400 group-hover:bg-gray-50 group-hover:text-gray-900 group-hover:border-gray-300"
        )}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      {/* ── Genişletilmiş özet ── */}
      <div 
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          expanded ? "grid-rows-[1fr] opacity-100 mt-6 pt-5 border-t border-gray-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          {article.abstract ? (
            <p className="text-[15px] leading-8 text-gray-600 mb-6 font-sans text-justify">
              <Highlight text={article.abstract} query={query} />
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-100 mb-6 border-dashed">
               <BookOpen className="w-8 h-8 text-gray-300 mb-2" />
               <p className="text-sm text-gray-500 font-medium">Bu makale için veritiabanında özet metni bulunmuyor.</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="text-xs font-mono text-gray-400">
                Açık Erişim ID: {article.id.split('/').pop()}
             </div>
             <a
               href={openAlex}
               target="_blank"
               rel="noopener noreferrer"
               onClick={(e) => e.stopPropagation()}
               className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#8A1538] hover:bg-[#6c102a] px-6 py-2.5 rounded-lg transition-all shadow-md active:scale-95"
             >
               Makaleyi İncele <ExternalLink className="w-4 h-4" />
             </a>
          </div>
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ANA COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function LiteratureArchive() {
  const [articles, setArticles]     = useState<Article[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [query, setQuery]           = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Advanced filters state
  const [searchField, setSearchField] = useState<"all" | "title" | "authors" | "abstract">("all");
  const [exactMatch, setExactMatch]   = useState(false);
  const [minCitations, setMinCitations] = useState<number | "">("");
  const [maxCitations, setMaxCitations] = useState<number | "">("");
  const [hasAbstractOnly, setHasAbstractOnly] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Sort state
  const [sortBy, setSortBy]         = useState<SortKey>("score");
  const [sortOrder, setSortOrder]   = useState<SortOrder>("desc");
  
  // Year filters
  const [yearMin, setYearMin]       = useState<number | "">("");
  const [yearMax, setYearMax]       = useState<number | "">("");
  
  const [page, setPage]             = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const topRef = useRef<HTMLDivElement>(null);

  // ── Veri yükle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/nukIeer/makaleler/refs/heads/main/network/makaleler_katalog.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Article[]) => { setArticles(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  // ── Debounce: arama kutusu her tuş basımında filtre tetiklemesin ───────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
      setExpandedId(null);
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  // ── Filtre & sıralama ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    return articles
      .filter((a) => {
        if (q) {
          const testTitle = (a.title || "").toLowerCase();
          const testAuthors = (a.authors || "").toLowerCase();
          const testAbstract = (a.abstract || "").toLowerCase();
          
          let hay = "";
          if (searchField === "all") {
             hay = `${testTitle} ${testAuthors} ${testAbstract}`;
          } else if (searchField === "title") {
             hay = testTitle;
          } else if (searchField === "authors") {
             hay = testAuthors;
          } else if (searchField === "abstract") {
             hay = testAbstract;
          }

          if (exactMatch) {
            if (!hay.includes(q)) return false;
          } else {
            const words = q.split(/\s+/).filter(Boolean);
            if (!words.every((w) => hay.includes(w))) return false;
          }
        }
        
        if (yearMin !== "" && (a.year ?? 0) < yearMin) return false;
        if (yearMax !== "" && (a.year ?? 9999) > yearMax) return false;
        
        if (minCitations !== "" && (a.citations ?? 0) < minCitations) return false;
        if (maxCitations !== "" && (a.citations ?? 0) > maxCitations) return false;
        
        if (hasAbstractOnly && !a.abstract) return false;

        return true;
      })
      .sort((a, b) => {
         let valA: number, valB: number;
         if (sortBy === "year") {
           valA = a.year ?? 0;
           valB = b.year ?? 0;
         } else if (sortBy === "citations") {
           valA = a.citations;
           valB = b.citations;
         } else {
           valA = a.score;
           valB = b.score;
         }
         return sortOrder === "desc" ? valB - valA : valA - valB;
      });
  }, [articles, debouncedQuery, sortBy, sortOrder, yearMin, yearMax]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePage = useCallback((p: number) => {
    setPage(p);
    setExpandedId(null);
    // Smooth scroll with a small offset for the sticky header
    const y = (topRef.current?.getBoundingClientRect().top || 0) + window.scrollY - 100;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, []);

  // ── Yıl aralığı hesapla (dinamik min/max) ──────────────────────────────────
  const { minYear, maxYear, maxOverallCitations } = useMemo(() => {
    const years = articles.map((a) => a.year).filter(Boolean) as number[];
    const cits = articles.map((a) => a.citations).filter(Boolean) as number[];
    return {
      minYear: years.length ? Math.min(...years) : 1900,
      maxYear: years.length ? Math.max(...years) : 2024,
      maxOverallCitations: cits.length ? Math.max(...cits) : 10000,
    };
  }, [articles]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [key, order] = e.target.value.split('-') as [SortKey, SortOrder];
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#FAFAFA] min-h-screen text-gray-900 font-sans pb-16">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-12 md:px-12 md:py-16 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 p-8 md:p-12 opacity-5 pointer-events-none">
           <Library className="w-56 h-56 md:w-72 md:h-72 text-[#8A1538]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] md:text-xs tracking-[0.2em] font-bold text-[#8A1538] uppercase mb-5 bg-rose-50 px-3 md:px-4 py-1.5 md:py-2 rounded border border-rose-100">
            <span className="w-2 h-2 rounded-full bg-[#8A1538] animate-pulse"></span>
            TÜBİTAK 2218 Veritabanı
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-5 tracking-tight">
            Literatür Arşivi
          </h1>
          <p className="text-gray-500 max-w-3xl text-sm md:text-lg leading-relaxed font-medium">
            Bilim Felsefesi, Nedensellik ve Doğa Yasaları konularını temel alan, detaylı meta verilerle derlenmiş <b className="text-[#8A1538]">10.180</b> adet makalenin anlık taranabilir gelişmiş arama arşivi.
          </p>
        </div>
      </div>

      {/* ── Arama & Filtre Paneli ────────────────────────────────────────────── */}
      <div 
        ref={topRef}
        className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-8 flex flex-col xl:flex-row gap-4 xl:gap-6 items-start xl:items-center justify-between">
          
          <div className="flex flex-col w-full gap-4 items-stretch flex-1">
            <div className="flex flex-col lg:flex-row gap-3 items-center w-full">
              {/* Arama Input */}
              <div className="relative w-full lg:flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    searchField === "all" ? "Başlık, yazar isimleri veya metin içi kelimeler..." :
                    searchField === "title" ? "Sadece başlıkta ara..." :
                    searchField === "authors" ? "Sadece yazar olarak ara..." :
                    "Sadece özet metinlerinde ara..."
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] transition-all focus:bg-white placeholder:font-medium placeholder:text-gray-400 shadow-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {/* Gelişmiş Butonu */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={cn(
                  "shrink-0 px-5 py-3.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-sm w-full lg:w-auto",
                  showAdvanced 
                    ? "bg-rose-50 text-[#8A1538] border-rose-200" 
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Gelişmiş Filtreler
              </button>
            </div>

            {/* Gelişmiş Filtreler Paneli */}
            {showAdvanced && (
              <div className="bg-white border border-[#8A1538]/10 rounded-2xl p-5 md:p-6 shadow-[0_8px_30px_rgba(138,21,56,0.05)] w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#8A1538]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                
                {/* Arama Alanı */}
                <div className="flex flex-col gap-2 relative z-10">
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Search className="w-3 h-3"/> Arama Hedefi</label>
                  <div className="relative">
                    <select 
                      value={searchField}
                      onChange={(e) => { setSearchField(e.target.value as any); setPage(1); }}
                      className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 pr-8 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] text-gray-800 cursor-pointer"
                    >
                      <option value="all">Tüm İçerik (Başlık, Yazar, Özet)</option>
                      <option value="title">Sadece Başlık</option>
                      <option value="authors">Sadece Yazar</option>
                      <option value="abstract">Sadece Özet</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Yıl Filtresi */}
                <div className="flex flex-col gap-2 relative z-10">
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3"/> Yayın Yılı</label>
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <input
                      type="number"
                      placeholder={String(minYear)}
                      value={yearMin}
                      onChange={(e) => { setYearMin(e.target.value ? Number(e.target.value) : ""); setPage(1); }}
                      className="w-full bg-transparent text-center text-sm font-mono font-bold focus:outline-none text-gray-800 placeholder:text-gray-400"
                    />
                    <span className="text-gray-300 font-bold">-</span>
                    <input
                      type="number"
                      placeholder={String(maxYear)}
                      value={yearMax}
                      onChange={(e) => { setYearMax(e.target.value ? Number(e.target.value) : ""); setPage(1); }}
                      className="w-full bg-transparent text-center text-sm font-mono font-bold focus:outline-none text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Atıf Filtresi */}
                <div className="flex flex-col gap-2 relative z-10">
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><BookOpen className="w-3 h-3"/> Atıf Sayısı</label>
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <input
                      type="number"
                      placeholder="0"
                      value={minCitations}
                      onChange={(e) => { setMinCitations(e.target.value ? Number(e.target.value) : ""); setPage(1); }}
                      className="w-full bg-transparent text-center text-sm font-mono font-bold focus:outline-none text-gray-800 placeholder:text-gray-400"
                    />
                    <span className="text-gray-300 font-bold">-</span>
                    <input
                      type="number"
                      placeholder={`${maxOverallCitations}`}
                      value={maxCitations}
                      onChange={(e) => { setMaxCitations(e.target.value ? Number(e.target.value) : ""); setPage(1); }}
                      className="w-full bg-transparent text-center text-sm font-mono font-bold focus:outline-none text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Davranış ve Görünürlük */}
                 <div className="flex flex-col gap-2 justify-center relative z-10">
                  <label className="text-xs font-extrabold text-transparent select-none hidden lg:block">_</label>
                  <div className="space-y-3">
                     <button 
                        onClick={() => { setExactMatch(!exactMatch); setPage(1); }}
                        className="flex items-center gap-2 group w-full text-left"
                     >
                       <div className="shrink-0 text-[#8A1538]">
                         {exactMatch ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-400" />}
                       </div>
                       <span className={cn("text-sm transition-colors font-semibold", exactMatch ? "text-gray-900" : "text-gray-500 group-hover:text-gray-800")}>
                         Birebir Kelime Eşleşmesi
                       </span>
                     </button>
                      <button 
                        onClick={() => { setHasAbstractOnly(!hasAbstractOnly); setPage(1); }}
                        className="flex items-center gap-2 group w-full text-left"
                     >
                       <div className="shrink-0 text-[#8A1538]">
                         {hasAbstractOnly ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-400" />}
                       </div>
                       <span className={cn("text-sm transition-colors font-semibold", hasAbstractOnly ? "text-gray-900" : "text-gray-500 group-hover:text-gray-800")}>
                         Sadece Özeti Olanlar
                       </span>
                     </button>
                  </div>
                </div>

              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-gray-100">
             {/* Sayı Rozeti */}
             <div className="text-sm font-sans font-medium text-gray-500 whitespace-nowrap flex items-center justify-center bg-[#8A1538]/5 rounded-xl border border-[#8A1538]/10 px-4 py-2 shrink-0 h-[52px]">
              {loading ? (
                 <Loader2 className="w-5 h-5 animate-spin text-[#8A1538]"/>
              ) : (
                 <span className="flex flex-col items-center leading-tight">
                    <span className="text-[#8A1538] font-bold text-lg">{filtered.length.toLocaleString("tr-TR")}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">Uyumlular</span>
                 </span>
              )}
             </div>

             {/* Sıralama */}
             <div className="relative shrink-0 flex-1 md:w-64 h-[52px]">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select 
                  value={`${sortBy}-${sortOrder}`}
                  onChange={handleSortChange}
                  className="w-full h-full appearance-none bg-white border border-gray-200 hover:border-gray-300 rounded-xl py-2 pl-11 pr-10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#8A1538]/20 focus:border-[#8A1538] transition-all text-gray-800 cursor-pointer shadow-sm"
                >
                  <option value="score-desc">Önem Algoritması (En Yüksek)</option>
                  <option value="citations-desc">Atıf Sayısına Göre (Z-a)</option>
                  <option value="citations-asc">Atıf Sayısına Göre (A-z)</option>
                  <option value="year-desc">Yayın Yılı (En Yeniler)</option>
                  <option value="year-asc">Yayın Yılı (En Eskiler)</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
             </div>
          </div>

        </div>
      </div>

      {/* ── İçerik ──────────────────────────────────────────────────────────── */}
      <div className="px-4 py-8 md:px-8 max-w-5xl mx-auto min-h-[50vh]">

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-gray-500">
            <Loader2 className="w-12 h-12 animate-spin text-[#8A1538] mb-6" />
            <p className="font-serif text-2xl text-gray-900 font-bold">Arşiv Yükleniyor</p>
            <p className="text-base font-sans mt-2">Araştırma veritabanına bağlanılıyor...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-8 text-center max-w-lg mx-auto mt-16 shadow-lg shadow-red-500/10">
            <span className="text-5xl mb-6 block">⚠️</span>
            <h3 className="font-bold text-2xl mb-3 font-serif text-red-900">Entegrasyon Hatası</h3>
            <p className="text-sm text-red-700/80 leading-relaxed font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && paginated.length === 0 && (
          <div className="flex flex-col items-center text-center py-32 text-gray-500 bg-white border border-gray-200 rounded-3xl border-dashed shadow-sm">
            <div className="w-24 h-24 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-3xl font-serif font-bold text-gray-900 mb-4">Sonuç Bulunamadı</p>
            <p className="text-base max-w-md leading-relaxed font-medium">Kullandığınız arama kriterlerine uygun veri bulunmuyor. Farklı veya daha genel anahtar kelimeler ile yıl aralığını genişletmeyi deneyin.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
           {!loading && !error && paginated.map((article) => (
             <ArticleCard
               key={article.id}
               article={article}
               query={debouncedQuery}
               expanded={expandedId === article.id}
               onToggle={() =>
                 setExpandedId(expandedId === article.id ? null : article.id)
               }
             />
           ))}
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-16 pt-8 border-t border-gray-200">
            <button
              disabled={page === 1}
              onClick={() => handlePage(page - 1)}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:border-[#8A1538] hover:text-[#8A1538] hover:bg-rose-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm group"
            >
              <ArrowLeft className="w-5 h-5 group-active:-translate-x-1 transition-transform" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) =>
                p === 1 || p === totalPages ||
                Math.abs(p - page) <= (window.innerWidth < 640 ? 1 : 2)
              )
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="text-gray-400 px-2 md:px-3 font-mono text-sm tracking-widest font-bold">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePage(p as number)}
                    className={cn(
                      "min-w-10 h-10 md:min-w-12 md:h-12 px-2 rounded-xl flex items-center justify-center text-sm md:text-base font-sans font-bold transition-all shadow-sm",
                      page === p 
                        ? "bg-[#8A1538] text-white border border-[#8A1538] ring-4 ring-[#8A1538]/10" 
                        : "bg-white border border-gray-200 text-gray-600 hover:text-[#8A1538] hover:border-[#8A1538] hover:bg-rose-50"
                    )}
                  >
                    {p}
                  </button>
                )
              )
            }

            <button
              disabled={page === totalPages}
              onClick={() => handlePage(page + 1)}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:border-[#8A1538] hover:text-[#8A1538] hover:bg-rose-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm group"
            >
              <ArrowRight className="w-5 h-5 group-active:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
