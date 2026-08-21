import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { Maximize2, Minimize2, Search, Link2, GitGraph, Loader2, Filter } from "lucide-react";
import { cn } from "../lib/utils";

interface CitationNode {
  id: string;
  name: string;
  year: number;
  citations: number;
  symbolSize: number;
  x?: number;
  y?: number;
}
interface ConceptNode {
  id: string;
  name?: string;
  label_en?: string;
  label_tr?: string;
  frequency: number;
  symbolSize: number;
  x?: number;
  y?: number;
}
interface Link {
  source: string;
  target: string;
  value: number;
}
interface NetworkData<N> {
  nodes: N[];
  links: Link[];
}

type Tab = "citation" | "concept";

function yearToColor(year: number): string {
  if (!year || year < 1950) return "#9ca3af";
  const t = Math.min(1, Math.max(0, (year - 1950) / (2024 - 1950)));
  const r = Math.round(156 + t * (138 - 156));
  const g = Math.round(163 + t * (21 - 163));
  const b = Math.round(175 + t * (56 - 175));
  return `rgb(${r},${g},${b})`;
}

export default function PhilosophyNetwork() {
  const [activeTab, setActiveTab] = useState<Tab>("citation");
  const [citationData, setCitationData] = useState<NetworkData<CitationNode> | null>(null);
  const [conceptData, setConceptData] = useState<NetworkData<ConceptNode> | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<CitationNode | ConceptNode | null>(null);
  const [nodeLimit, setNodeLimit] = useState(250);
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [citRes, conRes, catalogRes] = await Promise.all([
          fetch("https://raw.githubusercontent.com/nukIeer/makaleler/refs/heads/main/network/citation_network.json"),
          fetch("https://raw.githubusercontent.com/nukIeer/makaleler/refs/heads/main/network/concept_network_tr.json"),
          fetch("https://raw.githubusercontent.com/nukIeer/makaleler/refs/heads/main/network/makaleler_katalog.json")
        ]);
        if (!citRes.ok || !conRes.ok || !catalogRes.ok) throw new Error("Ağ verileri yüklenemedi.");
        const [cit, con, catalogData] = await Promise.all([citRes.json(), conRes.json(), catalogRes.json()]);
        setCitationData(cit);
        setConceptData(con);
        setCatalog(catalogData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', updateDimensions);
    const timeout = setTimeout(updateDimensions, 100);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);

  const filteredData = useMemo(() => {
    const rawData = activeTab === "citation" ? citationData : conceptData;
    if (!rawData) return null;

    const sortedNodes = [...rawData.nodes].sort((a: any, b: any) => {
      const valA = a.citations !== undefined ? a.citations : (a.frequency || 0);
      const valB = b.citations !== undefined ? b.citations : (b.frequency || 0);
      return valB - valA;
    });

    const topNodes = sortedNodes.slice(0, nodeLimit);
    const topNodeIds = new Set(topNodes.map(n => n.id));

    let topLinks = rawData.links.filter(l => 
      topNodeIds.has(l.source?.id || l.source) && topNodeIds.has(l.target?.id || l.target)
    );

    // Deep copy and assign 'val' for internal physics calculation
    return { 
      nodes: topNodes.map((n: any) => {
        // Logaritmik boyutlandırma: Aşırı büyük düğümleri engeller
        let size = 5;
        if (activeTab === "citation") {
          size = Math.max(4, Math.log1p(n.citations || 1) * 2.5);
        } else {
          size = Math.max(4, Math.log1p(n.frequency || 1) * 3);
        }
        return { ...n, val: size };
      }), 
      links: topLinks.map((l: any) => ({ ...l })) 
    };
  }, [activeTab, citationData, conceptData, nodeLimit]);

  useEffect(() => {
    // Fizik motoru ayarlarını daha ferah bir ağ verecek şekilde yapılandır
    if (fgRef.current && filteredData) {
      const charge = fgRef.current.d3Force('charge');
      const link = fgRef.current.d3Force('link');
      
      if (charge) {
        charge.strength(activeTab === "concept" ? -600 : -500); // Kavram ve atıf ağında itme kuvvetini çok artır (diken yumağı olmasını engeller)
        charge.distanceMax(activeTab === "concept" ? 1000 : 800);
      }
      if (link) {
        link.distance(activeTab === "concept" ? 100 : 80); // Bağlantı uzunlukları
      }
    }
  }, [filteredData, isFullscreen, activeTab]);

  const handleSearch = useCallback(() => {
    const q = search.trim().toLowerCase();
    if (!q) { 
      setHighlighted(null); 
      setSelectedNode(null);
      return; 
    }
    const data = filteredData;
    const found = data?.nodes.find((n: any) => {
      const targetName = n.label_tr || n.name || "";
      return targetName.toLowerCase().includes(q) || n.id.toLowerCase().includes(q);
    });
    setHighlighted(found ? found.id : null);
    if (found) {
      setSelectedNode(found as any);
      if (fgRef.current && typeof found.x === 'number' && typeof found.y === 'number') {
         fgRef.current.centerAt(found.x, found.y, 1000);
         fgRef.current.zoom(3, 1000);
      }
    }
  }, [search, filteredData]);

  // Düğüm Çizimi
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label_tr || node.name || node.id;
    const isSelected = selectedNode?.id === node.id;
    const isHighlighted = highlighted === node.id;

    // Önceden hesaplanmış boyutu al
    const size = node.val || 5;

    const baseColor = activeTab === "citation" ? yearToColor(node.year) : "rgba(138, 21, 56, 0.7)";
    const color = isSelected || isHighlighted ? "#8A1538" : baseColor;

    // Düğüm çiz
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.lineWidth = isSelected || isHighlighted ? 3 / globalScale : 1 / globalScale;
    ctx.strokeStyle = isSelected || isHighlighted ? "#000" : "#fff";
    ctx.stroke();

    // Seçili ya da aranan ise etrafına hale çiz
    if (isSelected || isHighlighted) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 6 / globalScale, 0, 2 * Math.PI, false);
      ctx.lineWidth = 2 / globalScale;
      ctx.strokeStyle = "rgba(138, 21, 56, 0.4)";
      ctx.stroke();
    }

    // Metin Çizimi
    ctx.font = `${Math.max(10 / globalScale, 4)}px Sans-Serif`;
    const labelText = activeTab === "concept" ? `${label} (${node.frequency})` : label;
    const textWidth = ctx.measureText(labelText).width;
    const textHeight = Math.max(10 / globalScale, 4);
    
    // Zoom seviyesine göre ya da büyük düğümlerde (veya spesifik tablarda) metni göster
    const showText = globalScale > 1.2 || isSelected || isHighlighted || (activeTab === "citation" ? size > 12 : size > 16);
    
    if (showText) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillRect(node.x - textWidth / 2 - 2, node.y + size + 2, textWidth + 4, textHeight + 4);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isSelected || isHighlighted ? "#8A1538" : "#1D1D1F";
      ctx.fillText(labelText, node.x, node.y + size + 2 + textHeight / 2);
    }
  }, [activeTab, selectedNode, highlighted]);

  return (
    <div 
      className={cn(
        "flex flex-col bg-white transition-all duration-300",
        isFullscreen 
          ? "fixed inset-0 z-[100] w-full h-[100dvh]" 
          : "relative w-full h-[700px] border border-gray-200 shadow-sm rounded-2xl overflow-hidden"
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-gray-100 bg-[#FAFAFA] gap-4">
        
        <div className="flex bg-white border border-gray-200 p-1 rounded-lg shadow-sm font-sans w-fit">
          <button
            onClick={() => { setActiveTab("citation"); setHighlighted(null); setSelectedNode(null); setSearch(""); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === "citation" ? "bg-[#8A1538] text-white" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Link2 className="w-4 h-4" />
            Atıf Ağı
          </button>
          <button
            onClick={() => { setActiveTab("concept"); setHighlighted(null); setSelectedNode(null); setSearch(""); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === "concept" ? "bg-[#8A1538] text-white" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <GitGraph className="w-4 h-4" />
            Kavram Ağı
          </button>
        </div>

        <div className="flex items-center gap-3">
          
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-1.5 shadow-sm font-sans mr-2">
             <Filter className="w-3 h-3 text-gray-500" />
             <span className="text-xs text-gray-600 font-medium hidden sm:inline">Bağlantı Limiti:</span>
             <select 
               value={nodeLimit} 
               onChange={(e) => setNodeLimit(Number(e.target.value))}
               className="text-xs font-bold text-gray-900 bg-transparent outline-none cursor-pointer"
             >
               <option value={100}>İlk 100</option>
               <option value={250}>İlk 250</option>
               <option value={500}>İlk 500</option>
               <option value={1000}>İlk 1000</option>
             </select>
          </div>

          <div className="relative font-sans hidden md:block">
            <input
              type="text"
              placeholder="Ara (Düğüm Bul)..."
              className="w-full md:w-56 bg-white border border-gray-200 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-[#8A1538] text-gray-900 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Search className="absolute left-3 top-[10px] w-4 h-4 text-gray-400" />
          </div>

          <button
             onClick={handleSearch}
             className="px-4 py-2 bg-[#FAFAFA] border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-sm ml-2 hidden md:block"
          >
            Bul
          </button>

          <button
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              setTimeout(() => fgRef.current?.zoomToFit(400), 100);
            }}
            className="p-2.5 bg-white border border-gray-200 rounded-md text-gray-600 hover:text-[#8A1538] hover:border-gray-300 transition-colors shadow-sm ml-auto md:ml-2"
            title={isFullscreen ? "Küçült" : "Tam Ekran Yap"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-[#FAFAFA] overflow-hidden" ref={containerRef}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 animate-spin text-[#8A1538] mb-4" />
            <p className="font-serif font-bold text-gray-900 text-lg">Ağ Analizi Bağlanıyor</p>
            <p className="font-sans text-sm text-gray-500 mt-2">Büyük veri setleri optimize ediliyor...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 text-center px-4">
             <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">✕</div>
             <p className="text-gray-900 font-serif font-bold text-xl mb-2">Veri Entegrasyon Hatası</p>
             <p className="text-gray-500 text-sm max-w-md font-sans leading-relaxed">{error}</p>
             <button onClick={() => window.location.reload()} className="mt-6 text-[#8A1538] font-semibold text-sm underline underline-offset-4">Yeniden Dene</button>
          </div>
        )}

        {!loading && !error && filteredData && (
          <div className="w-full h-full cursor-crosshair">
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={filteredData}
              nodeLabel={() => ""} // Kapattık, custom canvas üzerinde çizdiriyoruz.
              nodeCanvasObject={nodeCanvasObject}
              linkColor={(link) => "rgba(100,100,100,0.15)"}
              linkWidth={(link) => 1}
              onNodeClick={(node: any) => {
                setSelectedNode(node);
                setHighlighted(node.id);
              }}
              onBackgroundClick={() => {
                setSelectedNode(null);
                setHighlighted(null);
              }}
              d3AlphaDecay={0.02} // Daha yavaş sönümleme, daha yumuşak yerleşim
              d3VelocityDecay={0.3}
            />
          </div>
        )}

        {/* Yan Panel (Side Drawer) */}
        {selectedNode && (
          <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white/80 backdrop-blur-3xl border-l border-white/40 shadow-2xl z-50 flex flex-col transform transition-transform duration-500 animate-in slide-in-from-right">
            
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100/50 bg-white/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
              <span className="text-[11px] font-extrabold text-[#8A1538] uppercase tracking-widest px-2 py-1 bg-rose-50/50 rounded border border-rose-100/50">
                {'citations' in selectedNode ? 'Makale Detayı' : 'Kavram Özeti'}
              </span>
              <button 
                onClick={() => { setSelectedNode(null); setHighlighted(null); }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title="Paneli Kapat"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-sans hide-scrollbar">
              {'citations' in selectedNode ? (() => {
                const articleDetail = catalog.find((c: any) => c.id === selectedNode.id) || selectedNode;
                const url = articleDetail.id?.startsWith("http") ? articleDetail.id : `https://openalex.org/${articleDetail.id}`;

                return (
                  <div className="flex flex-col gap-6">
                    <h3 className="text-gray-900 font-serif font-bold text-2xl leading-tight">
                      {articleDetail.title || articleDetail.name || 'İsimsiz Düğüm'}
                    </h3>

                    {articleDetail.authors && (
                      <div className="flex items-start gap-3 text-sm text-gray-600 bg-gray-50/60 p-4 rounded-xl border border-gray-100/60">
                        <span className="font-semibold text-gray-800 w-16 shrink-0">Yazarlar:</span>
                        <p className="leading-relaxed">{articleDetail.authors}</p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <div className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center gap-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Yayın Yılı</span>
                        <span className="font-bold text-lg text-gray-900">{articleDetail.year || 'Bilinmiyor'}</span>
                      </div>
                      <div className="flex-1 bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex flex-col justify-center items-center gap-1">
                        <span className="text-xs font-semibold text-rose-500 uppercase tracking-widest">Atıf Değeri</span>
                        <span className="text-[#8A1538] font-black text-xl">{articleDetail.citations?.toLocaleString("tr-TR") || 0}</span>
                      </div>
                    </div>

                    {articleDetail.abstract ? (
                      <div className="flex flex-col gap-3 mt-4">
                         <span className="font-bold text-gray-900 text-base font-serif flex items-center gap-2">Özet (Abstract)</span>
                         <p className="text-[15px] leading-8 text-gray-600 text-justify">
                           {articleDetail.abstract}
                         </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 mt-4 p-5 bg-gray-50/80 rounded-xl border border-gray-100 border-dashed text-center">
                         <span className="text-gray-400 font-medium text-sm">Bu makale için özet metni bulunmuyor.</span>
                      </div>
                    )}
                    
                    {articleDetail.id && (
                      <div className="mt-8 pb-4">
                        <a 
                          href={url}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-[#8A1538] hover:bg-[#6c102a] text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(138,21,56,0.39)] hover:shadow-[0_6px_20px_rgba(138,21,56,0.23)] active:scale-95 text-sm"
                        >
                          OpenAlex'te Görüntüle <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })() : (
                <div className="flex flex-col gap-5">
                  <h3 className="text-gray-900 font-sans font-bold text-3xl leading-snug capitalize mb-2">{selectedNode.label_tr || selectedNode.name || selectedNode.id}</h3>
                  <div className="flex flex-col gap-2 bg-gradient-to-br from-rose-50 to-white p-5 rounded-2xl border border-rose-100/50 shadow-sm">
                    <span className="font-semibold text-rose-800 text-sm">Frekans (Frequency) Puanı</span>
                    <span className="text-[#8A1538] font-black text-4xl">{selectedNode.frequency?.toLocaleString("tr-TR")}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-4 leading-relaxed p-4 bg-gray-50 rounded-xl">
                    Bu puan, kavramın veya bileşenlerinin veritabanındaki 10.180 makale özetinde ne sıklıkla birlikte geçirildiğini ve ağırlığını belirtir. Yüksek frekans, literatürde ana odaklanan temalardan biri olduğunu gösterir.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="absolute top-4 left-4 flex flex-col gap-3 z-10 pointer-events-none">
             <div className="bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg font-sans text-xs shadow-sm flex flex-col gap-1 max-w-sm">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                   <span className="font-bold text-gray-900">Doğal Yerleşim Aktif</span>
                 </div>
                 <p>
                   En önemli <b>{nodeLimit} düğüm</b> gösteriliyor. Logaritmik boyutlandırma ve optimize edilmiş d3-force itme kuvveti devrede. (İç içe geçmeler önlenmiştir).
                 </p>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
