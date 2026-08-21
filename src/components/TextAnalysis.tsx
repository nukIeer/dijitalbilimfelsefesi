import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as d3 from 'd3';

const customStopWords = [
  'work', 'research', 'study', 'concept', 'theory', 'provide', 'relation', 
  'effect', 'data', 'model', 'using', 'knowledge', 'analysis', 'iş', 
  'araştırma', 'sunmak', 'sosyal', 'çalışmak', 'sağlamak', 'kullanarak', 
  'paper', 'article', 'arguments', 'account', 'problem', 'view', 'two', 
  'different', 'case', 'one', 'way', 'new', 'well', 'make', 'use', 
  'question', 'term', 'role', 'important', 'within', 'also', 'part', 'based',
  'particular', 'however'
];

function BubbleChartSVG({ data, isEnglish }: { data: any[], isEnglish?: boolean }) {
  const width = 500;
  const height = 500;
  
  const bubbles = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Scale the count values to compress the differences slightly (log or sqrt)
    // to prevent one giant bubble dominating.
    const hierarchyData = d3.hierarchy({ children: data })
      .sum((d: any) => Math.pow(d.count || 0, 0.6))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const pack = d3.pack()
      .size([width, height])
      .padding(6);

    const root = pack(hierarchyData);
    return root.children || [];
  }, [data]);

  if (!bubbles.length) return null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible drop-shadow-sm">
      {bubbles.map((node: any, i: number) => {
        // Renk paleti ayarı: İngilizce mavi tonlar, Türkçe bordo/kırmızı tonlar
        const color = isEnglish 
          ? `hsla(210, 75%, ${40 + (i % 6) * 8}%, 0.9)` 
          : `hsla(342, 75%, ${35 + (i % 6) * 8}%, 0.9)`; 
        const fontSize = Math.max(10, node.r / 3);
        const label = node.data.name || node.data.word;
        
        return (
          <motion.g
            key={label}
            initial={{ scale: 0, opacity: 0, x: width / 2, y: height / 2 }}
            animate={{ scale: 1, opacity: 1, x: node.x, y: node.y }}
            transition={{ type: 'spring', damping: 15, stiffness: 80, delay: i * 0.05 }}
            className="cursor-pointer group"
          >
            <motion.circle
              r={node.r}
              fill={color}
              className="drop-shadow-sm stroke-white/20 stroke-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
            <text
              fill="#ffffff"
              textAnchor="middle"
              alignmentBaseline="middle"
              fontSize={fontSize}
              fontWeight="bold"
              className="pointer-events-none drop-shadow-md select-none"
            >
              {label}
            </text>
            <text
              y={node.r / 2 + 5}
              fill="#ffffff"
              textAnchor="middle"
              alignmentBaseline="middle"
              fontSize={fontSize * 0.6}
              fontWeight="medium"
              className="pointer-events-none opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none drop-shadow-md"
            >
              {node.data.count.toLocaleString('tr-TR')}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}

export default function TextAnalysis() {
  const [data, setData] = useState<{ themesData: any[], wordsData: any[] }>({ themesData: [], wordsData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch TR concepts
        const trRes = await fetch('https://raw.githubusercontent.com/nukIeer/makaleler/refs/heads/main/network/concept_network_tr.json');
        if (!trRes.ok) throw new Error('TR veri çekilemedi');
        const trData = await trRes.json();

        // Fetch EN concepts
        const enRes = await fetch('https://raw.githubusercontent.com/nukIeer/makaleler/refs/heads/main/network/concept_network.json');
        if (!enRes.ok) throw new Error('EN veri çekilemedi');
        const enData = await enRes.json();

        // 3. customStopWords filtresi
        const trConcepts = trData.nodes
          .filter((n: any) => {
            const word = (n.label_tr || n.name || "").toLowerCase();
            return !customStopWords.includes(word);
          })
          .sort((a: any, b: any) => b.frequency - a.frequency)
          .slice(0, 45) // Daha çok kabarcık güzel durur
          .map((n: any) => ({ word: n.label_tr || n.name, count: n.frequency }));

        const enConcepts = enData.nodes
          .filter((n: any) => {
            const word = (n.label_en || n.name || "").toLowerCase();
            return !customStopWords.includes(word);
          })
          .sort((a: any, b: any) => b.frequency - a.frequency)
          .slice(0, 45) // Daha çok kabarcık
          .map((n: any) => ({ name: n.label_en || n.name, count: n.frequency }));

        setData({
          wordsData: trConcepts,
          themesData: enConcepts
        });
      } catch (err: any) {
        setError(err.message || 'Hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[500px] w-full flex-col gap-4 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#8A1538]" />
        <p className="font-serif font-bold text-gray-900 text-lg">Semantik Ağ Analiz Ediliyor</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-red-50 text-[#8A1538] border border-red-100 rounded-xl">
        <p className="font-sans font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 w-full">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">Metin & Kelime Bulutu Analizi</h2>
        <p className="font-sans text-gray-600">
          9.992 adet makaledeki odak kavramların kabarcık dağılımı (Jenerik terimler doğal dil işlemeyle filtrelenmiştir).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-6">
          <div className="flex justify-between items-end border-b border-gray-100 pb-4">
            <h3 className="font-serif text-2xl font-bold text-gray-900">Merkezi Kavramlar</h3>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-100">İngilizce (Orijinal)</span>
          </div>
          <div className="h-[450px] w-full relative flex items-center justify-center bg-gray-50/50 rounded-xl">
            <BubbleChartSVG data={data.themesData} isEnglish={true} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-6">
          <div className="flex justify-between items-end border-b border-gray-100 pb-4">
            <h3 className="font-serif text-2xl font-bold text-gray-900">Merkezi Kavramlar</h3>
            <span className="bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-rose-100">Türkçe (Çeviri)</span>
          </div>
          <div className="h-[450px] w-full relative flex items-center justify-center bg-gray-50/50 rounded-xl">
            <BubbleChartSVG data={data.wordsData} isEnglish={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
