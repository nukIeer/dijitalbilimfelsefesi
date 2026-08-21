import { useState, useEffect, useMemo, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { Loader2 } from 'lucide-react';
import * as THREE from 'three';

export default function ThreeDVisualization() {
  const [data, setData] = useState<{ nodes: any[], links: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodeLimit, setNodeLimit] = useState(150);
  const fgRef = useRef<any>();

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const res = await fetch('https://raw.githubusercontent.com/nukIeer/makaleler/refs/heads/main/network/concept_network_tr.json');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNetwork();
  }, []);

  const filteredData = useMemo(() => {
    if (!data) return null;
    
    // Frekansa göre sıralayıp en yüksek `nodeLimit` kadarını alıyoruz
    const sortedNodes = [...data.nodes].sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
    const topNodes = sortedNodes.slice(0, nodeLimit);
    const topNodeIds = new Set(topNodes.map(n => n.id));

    // Yalnızca geçerli node'lar arasındaki bağlantıları kabul et
    const topLinks = data.links.filter(l => 
      topNodeIds.has(l.source?.id || l.source) && topNodeIds.has(l.target?.id || l.target)
    );

    return {
      nodes: topNodes.map((n: any) => ({ ...n, val: Math.max(2, Math.sqrt(n.frequency || 10)) })),
      links: topLinks.map((l: any) => ({ ...l, value: Math.max(1, Math.sqrt(l.weight || 1)) }))
    };
  }, [data, nodeLimit]);

  useEffect(() => {
    if (fgRef.current && filteredData) {
      const charge = fgRef.current.d3Force('charge');
      const link = fgRef.current.d3Force('link');
      if (charge) {
        charge.strength(-800);
        charge.distanceMax(1200);
      }
      if (link) {
        link.distance(120);
      }
    }
  }, [filteredData]);

  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({ 
      color: 0xf43f5e, 
      transparent: true, 
      opacity: 0.8,
      blending: THREE.AdditiveBlending 
    });
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="border-b border-gray-200 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">3B Kavramsal Ağ Görselleştirmesi</h2>
          <p className="font-sans text-gray-600">Makale özetlerinden elde edilen kavramsal bağların galaktik 3 boyutlu ağı.</p>
        </div>
        
        {/* Limit Seçici */}
         <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-1.5 shadow-sm font-sans w-fit">
           <span className="text-xs text-gray-600 font-medium">Bağlantı Limiti:</span>
           <select 
             value={nodeLimit} 
             onChange={(e) => setNodeLimit(Number(e.target.value))}
             className="text-xs font-bold text-gray-900 bg-transparent outline-none cursor-pointer"
           >
             <option value={50}>İlk 50</option>
             <option value={100}>İlk 100</option>
             <option value={150}>İlk 150</option>
             <option value={300}>İlk 300</option>
             <option value={500}>İlk 500</option>
           </select>
        </div>
      </div>

      <div className="w-full h-[600px] bg-[#050510] shadow-[0_0_30px_rgba(0,0,0,0.3)_inset] overflow-hidden flex flex-col relative rounded-xl border-2 border-[#1a1a2e]">
        <div className="p-4 bg-[#050510]/60 absolute top-0 left-0 z-10 w-full backdrop-blur-md border-b border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4 text-white pointer-events-none">
          <div className="flex gap-6">
            <span className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase"><div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></div> Kavram Düğümleri</span>
            <span className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase opacity-70"><div className="w-2.5 h-2.5 rounded-full bg-white/20"></div> Eş-Oluşum (Co-occurrence)</span>
          </div>
          
          {filteredData && (
            <span className="text-xs font-mono text-white/50 tracking-widest uppercase">
              {filteredData.nodes.length} Düğüm / {filteredData.links.length} Bağ
            </span>
          )}
        </div>
        
        <div className="flex-1 w-full relative flex items-center justify-center">
          {loading ? (
             <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          ) : filteredData ? (
            /* @ts-ignore */
            <ForceGraph3D
              ref={fgRef}
              graphData={filteredData}
              nodeLabel={(node: any) => `${node.label_tr || node.name} (Frekans: ${node.frequency})`}
              nodeThreeObject={(node: any) => {
                const geom = new THREE.SphereGeometry(node.val, 16, 16);
                const mesh = new THREE.Mesh(geom, glowMaterial);
                // Glow sprite
                const spriteMaterial = new THREE.SpriteMaterial({
                  color: 0xf43f5e,
                  transparent: true,
                  opacity: 0.4,
                  blending: THREE.AdditiveBlending
                });
                const sprite = new THREE.Sprite(spriteMaterial);
                const glowSize = node.val * 3;
                sprite.scale.set(glowSize, glowSize, 1);
                mesh.add(sprite);
                return mesh;
              }}
              linkColor={() => 'rgba(255,255,255,0.08)'}
              linkWidth={(link: any) => (link.value || 1) * 0.3}
              backgroundColor="#050510"
              showNavInfo={false}
              linkDirectionalParticles={1}
              linkDirectionalParticleWidth={1.5}
              linkDirectionalParticleSpeed={0.005}
              d3AlphaDecay={0.015} // daha fazla sürtünme optimizasyonu (daha pürüzsüz)
              d3VelocityDecay={0.2} // hareketin durmasını yumuşatır
            />
          ) : (
            <div className="text-white/50">Ağ verisi yüklenemedi.</div>
          )}
        </div>
      </div>
    </div>
  );
}
