import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Translations({ articles }: { articles: any[] }) {
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  const toggleAbstract = (id: string) => {
    setExpandedAbstracts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Genel Amaç: Sadece Türkçe özeti/çevirisi yapılmış olan makaleleri genel olarak göster.
  const filteredArticles = articles.filter(a => a.ozet_tr && a.ozet_tr.trim() !== '');

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
      <div className="border-b border-gray-200 pb-8 flex flex-col gap-3">
        <h1 className="font-serif text-4xl font-bold text-gray-900">
          Türkçe Çeviriler ve Özetler
        </h1>
        <p className="font-sans text-base text-gray-600 max-w-3xl">
          Literatür taraması kapsamında derlenen ve Türkçe çevirisi ile birlikte sisteme aktarılan makalelere ait kapsamlı özet okuma alanı.
        </p>
      </div>

      <div className="flex flex-col gap-0 border-t border-gray-200">
        {filteredArticles.map((article, idx) => {
          const cardId = article.id || String(idx);
          const isExpanded = expandedAbstracts[cardId];
          return (
            <div key={cardId} className="flex flex-col py-8 border-b border-gray-200 group">
              <div className="flex flex-wrap items-center gap-3 mb-3 font-sans text-xs">
                <span className="font-bold text-white bg-[#8A1538] px-2 py-1">
                  {article.yil || 'Tarihsiz'}
                </span>
                <span className="text-gray-900 font-bold uppercase tracking-widest pl-2">
                  {article.dergi_adi || article.dergi_kodu}
                </span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#8A1538] transition-colors">
                {article.baslik}
              </h3>
              
              <p className="font-sans text-[15px] font-medium text-gray-700 mb-4">
                Yazar: {article.yazar}
              </p>

              {(article.ozet_tr || article.ozet_en) && (
                <div className="mt-2">
                  <button 
                    onClick={() => toggleAbstract(cardId)}
                    className="font-sans font-semibold text-sm text-gray-900 flex items-center gap-2 hover:text-[#8A1538] transition-colors"
                  >
                    <span className="border-b border-transparent group-hover:border-[#8A1538] pb-0.5">
                       {isExpanded ? 'Çeviriyi Gizle' : 'Türkçe Çeviriyi Oku'}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-180")} />
                  </button>
                  
                  <div className={cn(
                    "grid transition-all duration-500 ease-in-out pl-0 sm:pl-6 border-l-2 border-[#8A1538] mt-6",
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 mt-0"
                  )}>
                    <div className="overflow-hidden flex flex-col gap-6 font-serif">
                      {article.ozet_tr && (
                        <div className="text-[17px] leading-relaxed text-gray-800">
                          {article.ozet_tr}
                        </div>
                      )}
                      {!article.ozet_tr && article.ozet_en && (
                        <div className="text-[15px] leading-relaxed text-gray-600 italic">
                          Türkçe çeviri henüz eklenmemiştir. <br/><br/>
                          <span className="block font-sans font-bold text-xs text-gray-400 mb-2 uppercase tracking-widest not-italic mt-4">ABSTRACT (EN)</span>
                          {article.ozet_en}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredArticles.length === 0 && (
          <div className="py-12 text-center font-sans text-gray-500">
            Kriterlere uygun çeviri bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
