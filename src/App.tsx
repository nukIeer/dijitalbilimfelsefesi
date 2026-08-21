import { useEffect, useState } from 'react';
import { Search, Info, Map, Network, Box, Globe, BarChart2, Globe2, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';
import SpatialAnalysis from './components/SpatialAnalysis';
import TextAnalysis from './components/TextAnalysis';
import PhilosophyNetwork from './components/PhilosophyNetwork';
import LiteratureArchive from './components/LiteratureArchive';
import ThreeDVisualization from './components/ThreeDVisualization';

type Section = 'hakkinda' | 'literatur_arsivi' | 'metin_analizi' | 'network_analizi' | 'mekansal_analiz' | 'gorsellestirme_3d';

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>(() => {
    return (localStorage.getItem('activeSection') as Section) || 'hakkinda';
  });

  useEffect(() => {
    localStorage.setItem('activeSection', activeSection);
  }, [activeSection]);

  const NavButton = ({ section, icon: Icon, label }: { section: Section, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveSection(section)}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all flex-shrink-0",
        activeSection === section 
          ? "bg-[#8A1538] text-white shadow-sm" 
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="bg-[#FAFAFA] min-h-screen w-full flex flex-col font-sans text-gray-900 selection:bg-[#8A1538] selection:text-white">
      {/* Refined Academic Navigation */}
      <nav className="sticky top-0 z-50 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-gray-200 py-3 flex justify-center w-full transition-all">
        <div className="max-w-[1270px] w-full px-6 flex flex-col items-center justify-between gap-4">
          <div className="flex flex-col items-center w-full border-b border-gray-200 pb-3 sm:border-0 sm:pb-0 sm:items-start">
            <span className="font-serif font-bold text-xl tracking-tight text-gray-900">
              KASTAMONU ÜNİVERSİTESİ
            </span>
            <span className="font-sans text-[10px] tracking-widest text-[#8A1538] uppercase font-semibold mt-1">
              TÜBİTAK 1001 Projesi (221K450)
            </span>
          </div>

          <div className="flex w-full overflow-x-auto gap-2 bg-white/50 p-1 rounded-lg border border-gray-200/60 shadow-sm custom-scrollbar pb-1">
             <NavButton section="hakkinda" icon={Info} label="Proje Hakkında" />
             <NavButton section="literatur_arsivi" icon={Search} label="Literatür Arşivi" />
             <div className="w-px h-6 bg-gray-200 my-auto mx-1 shrink-0"></div>
             <NavButton section="metin_analizi" icon={BarChart2} label="Metin Analizi" />
             <NavButton section="mekansal_analiz" icon={Globe2} label="Mekânsal Analiz" />
             <NavButton section="network_analizi" icon={Network} label="Ağ Analizi" />
             <NavButton section="gorsellestirme_3d" icon={Box} label="3B Görselleştirme" />
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 w-full flex flex-col items-center">
        <div className="max-w-[1270px] w-full px-6 py-12 md:py-16 flex flex-col gap-8">
          
          {activeSection === 'hakkinda' && (
            <div className="flex flex-col gap-16 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
               
               {/* Hero */}
               <section className="flex flex-col gap-8 border-b border-gray-200 pb-16">
                 <div>
                    <h4 className="text-sm font-sans font-bold text-[#8A1538] tracking-widest uppercase mb-4">TÜBİTAK 1001 Projesi (No: 221K450)</h4>
                    <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.15]">
                      Investigation of Metaphysical Concepts of Philosophy of Science with Digitalisation in Humanities
                    </h1>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-4">
                   <div className="flex flex-col gap-2">
                     <span className="text-xs font-sans font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2">Proje Yürütücüsü</span>
                     <span className="text-base font-serif font-semibold text-gray-900">Dr. Öğr. Üyesi Ömer Fatih TEKİN</span>
                   </div>
                   <div className="flex flex-col gap-2">
                     <span className="text-xs font-sans font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2">Kurum</span>
                     <span className="text-base font-serif font-semibold text-gray-900">Kastamonu Üniversitesi</span>
                   </div>
                   <div className="flex flex-col gap-2">
                     <span className="text-xs font-sans font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2">Ana Odak</span>
                     <span className="text-base font-serif font-normal italic text-gray-700">Doğa Yasaları ve Nedensellik Kavramları</span>
                   </div>
                 </div>
                 
                 <div className="flex flex-wrap gap-3 mt-2">
                   {['Metafizik', 'Kavramlar', 'Ağ Analizi', 'Veri Görselleştirme', 'Dijital Haritalama'].map(tag => (
                     <span key={tag} className="px-3 py-1 font-sans text-xs tracking-wide uppercase text-gray-600 border border-gray-300">
                       {tag}
                     </span>
                   ))}
                 </div>
               </section>

               {/* Proje Hakkında */}
               <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
                 <div className="lg:col-span-7 flex flex-col gap-6">
                   <h2 className="font-serif text-3xl font-bold text-gray-900">Dijital Beşeri Bilimlerle Bilim Felsefesi</h2>
                   <div className="font-sans text-[17px] leading-relaxed text-gray-700 space-y-6">
                     <p className="first-letter:text-6xl first-letter:font-serif first-letter:font-bold first-letter:text-[#8A1538] first-letter:float-left first-letter:mr-3 first-letter:mt-1">Bu araştırma projesi, bilim felsefesinin temel metafizik kavramlarını dijitalleştirme yoluyla analiz etmeyi, görselleştirmeyi ve haritalamayı hedeflemektedir. Özellikle doğa yasaları ve nedensellik kavramları üzerinden dijital bilim felsefesinin yeni bir metodolojisini geliştirmeyi amaçlıyoruz.</p>
                     <p>Proje, klasik felsefe çalışmalarını dijital beşeri bilimler araçlarıyla birleştirerek, bilim felsefesi literatüründeki kavramsal ilişkileri ağ analizi, metin madenciliği ve veri görselleştirme teknikleriyle ortaya çıkarmaktadır.</p>
                     <p>Dijital yöntemler kullanarak, felsefi metinlerdeki kavramsal yapıları, ekoller arası ilişkileri ve tarihsel gelişimleri görsel ve analitik bir biçimde sunuyoruz. Bu yaklaşım, bilim felsefesi araştırmalarına yeni bir perspektif kazandırmayı hedeflemektedir.</p>
                     <p>Dijital bilim felsefesi yaklaşımımız, geleneksel felsefi analiz yöntemlerini modern veri bilimi teknikleriyle harmanlayarak, bilim felsefesi literatüründe yeni içgörüler elde etmeyi sağlar. Bu çalışma, Türkiye'de dijital beşeri bilimler alanında öncü projelerden biri olması ve bilim felsefesi araştırmalarına metodolojik yenilik getirmesi açısından önem taşımaktadır.</p>
                   </div>
                 </div>
                 
                 <div className="lg:col-span-5 flex flex-col gap-8 border-l border-gray-200 pl-0 lg:pl-12">
                    {[
                      { t: 'Yenilikçi Yaklaşım', d: 'Dijital beşeri bilimler ile bilim felsefesini buluşturan disiplinler arası metodoloji.' },
                      { t: 'Kapsamlı Veri', d: 'Geniş literatür taraması ve dijital arşivleme ile oluşturulan zengin veri seti.' },
                      { t: 'Görsel Analiz', d: 'Ağ görselleştirmeleri ve interaktif haritalarla kavramsal ilişkilerin keşfi.' },
                      { t: 'Açık Bilim', d: 'Araştırma verilerinin ve araçlarının akademik toplulukla paylaşılması.' }
                    ].map(item => (
                      <div key={item.t} className="flex flex-col gap-2">
                        <span className="font-serif font-bold text-xl text-gray-900">{item.t}</span>
                        <p className="font-sans text-sm leading-relaxed text-gray-600">{item.d}</p>
                      </div>
                    ))}
                 </div>
               </section>

               {/* Ana Konular */}
               <section className="flex flex-col gap-10 bg-white p-8 md:p-16 border border-gray-200 shadow-sm">
                 <div className="text-center md:text-left">
                    <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">Araştırma Alanları</h2>
                    <p className="font-sans text-gray-500">Projemizin odaklandığı temel kavramsal alanlar ve araştırma konuları.</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {[
                      { t: 'Doğa Yasaları', d: 'Doğa yasalarının metafizik doğası, farklı felsefi yaklaşımlar (Humean, non-Humean teoriler), bilimsel yasaların statüsü ve evrensellik tartışmaları. Dijital analiz yöntemleriyle literatürdeki yaklaşımların haritalanması.' },
                      { t: 'Nedensellik', d: 'Nedensellik kavramının felsefi analizi, sebep-sonuç ilişkilerinin doğası, determinizm ve indeterminizm tartışmaları, kuantum mekaniğinde nedensellik. Kavramsal ağların dijital görselleştirmesi.' },
                      { t: 'Kavramsal Ağ Analizi', d: 'Bilim felsefesi literatüründeki kavramsal ilişkilerin ağ analizi yöntemleriyle incelenmesi. Yazarlar, kavramlar ve ekoller arası bağlantıların dijital haritalanması ve görselleştirilmesi.' },
                      { t: 'Metin Madenciliği', d: 'Felsefi metinlerin dijital analizi, doğal dil işleme teknikleriyle kavram çıkarımı, literatürdeki eğilimlerin ve değişimlerin tespit edilmesi. Büyük ölçekli metin korpuslarının işlenmesi.' }
                    ].map((k, i) => (
                      <div key={k.t} className="flex gap-4">
                        <div className="font-serif text-3xl font-bold text-gray-300">0{i+1}</div>
                        <div className="flex flex-col gap-2 mt-1">
                          <h4 className="font-serif text-xl font-bold text-gray-900">{k.t}</h4>
                          <p className="font-sans text-[15px] leading-relaxed text-gray-600">{k.d}</p>
                        </div>
                      </div>
                    ))}
                 </div>
               </section>

               {/* Ekip ve İletişim */}
               <section className="flex flex-col gap-6 mt-4">
                 <div className="px-2">
                   <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                     <div className="w-2 h-6 bg-[#8A1538] rounded-full"></div>
                     Büyük Veri & Ölçeklenebilirlik Analizi
                   </h3>
                   <p className="text-[15px] pt-1 text-gray-600">Sisteme büyük boyutlu veri seti (örn: 10.000+ makale) girildiğinde oluşabilecek limitasyonlar ve çözüm önerileri.</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-200">
                       <h4 className="font-bold text-gray-900 mb-2 text-lg">1. Tarayıcı Belleği ve Ağ Sınırları</h4>
                       <p className="text-sm text-gray-600 leading-relaxed">Mevcut yapı tüm veriyi GitHub üzerinden tek bir JSON nesnesi olarak çekmektedir. Veri çok büyüdüğünde sayfanın ilk açılış (download) süresi yavaşlayacak ve tarayıcı belleğini şişirecektir. <b>Çözüm:</b> Verilerin sunucudan sayfalara bölünerek (Pagination) çekilmesi ve Node.js/Python tabanlı bir backend veritabanı kurulması.</p>
                    </div>
                    <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-200">
                       <h4 className="font-bold text-gray-900 mb-2 text-lg">2. Ağ Görselleştirmesi (Network & 3D)</h4>
                       <p className="text-sm text-gray-600 leading-relaxed">Binlerce düğüm (node) ve bağ (link) içeren bir ağ grafiği, tarayıcının fizik motorunu (WebGL/Canvas) aşırı yorarak cihazı dondurabilir. <b>Çözüm:</b> Görselleştirmelerde kümeleme (Clustering) yapılması veya doğrudan yalnızca en çok atıf alan/en ilişkili 500 düğümün filtrelenerek çizdirilmesi.</p>
                    </div>
                    <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-200">
                       <h4 className="font-bold text-gray-900 mb-2 text-lg">3. Metin İşleme ve İstemci Yükü</h4>
                       <p className="text-sm text-gray-600 leading-relaxed">On binlerce makale özeti üzerinde tarayıcı (istemci) tabanlı anlık metin analizi yapmak mümkün değildir. <b>Çözüm:</b> Ağır Doğal Dil İşleme (NLP) analizlerinin sunucu tarafında (Python vb.) önceden hesaplatılıp arayüze sadece sonuçların gönderilmesi.</p>
                    </div>
                    <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-200">
                       <h4 className="font-bold text-gray-900 mb-2 text-lg">4. DOM Şişmesi (Arayüz Kilitlenmesi)</h4>
                       <p className="text-sm text-gray-600 leading-relaxed">HTML içine binlerce makale kartının aynı anda basılması DOM'da on binlerce element yaratıp sayfayı kilitler. <b>Çözüm:</b> Sadece kullanıcının ekranında o an görünen kısımları render eden Sanal Liste (Virtualization) kütüphanelerinin (örn: <i>react-window</i>) entegre edilmesi.</p>
                    </div>
                 </div>
               </section>

               <section className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
                 <div className="flex flex-col gap-6">
                   <h3 className="font-serif text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4">Akademik Kadro</h3>
                   <div className="flex items-start gap-5">
                     <div className="flex flex-col gap-1">
                       <h4 className="font-serif font-bold text-lg text-gray-900">Dr. Öğr. Üyesi Ömer Fatih TEKİN</h4>
                       <span className="font-sans text-[11px] font-bold text-[#8A1538] uppercase tracking-widest">Proje Yürütücüsü</span>
                       <div className="font-sans text-[14px] text-gray-600 mt-2 leading-relaxed">
                         <p>Kastamonu Üniversitesi</p>
                         <p>Fen-Edebiyat Fakültesi, Felsefe Bölümü</p>
                         <p className="mt-3 text-gray-800 text-sm font-medium">Uzmanlık: Bilim Felsefesi, Dijital Beşeri Bilimler</p>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="flex flex-col gap-6">
                   <h3 className="font-serif text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4">İletişim</h3>
                   <div className="flex flex-col gap-6">
                     <div className="font-sans">
                       <p className="text-[15px] text-gray-800 leading-relaxed">
                         Kastamonu Üniversitesi<br />
                         Fen-Edebiyat Fakültesi, Felsefe Bölümü<br />
                         Kastamonu, Türkiye
                       </p>
                     </div>
                     <div>
                       <a href="mailto:oftekin@kastamonu.edu.tr" className="font-sans text-[16px] font-semibold text-[#8A1538] hover:text-black transition-colors underline underline-offset-4">
                         oftekin@kastamonu.edu.tr
                       </a>
                       <p className="font-sans text-[13px] text-gray-500 mt-2 italic">
                         İş birliği veya sorularınız için iletişime geçebilirsiniz.
                       </p>
                     </div>
                   </div>
                 </div>
               </section>

            </div>
          )}

          {activeSection === 'mekansal_analiz' && <SpatialAnalysis />}
          
          {activeSection === 'metin_analizi' && <TextAnalysis />}

          {activeSection === 'literatur_arsivi' && <LiteratureArchive />}

          {activeSection === 'network_analizi' && <PhilosophyNetwork />}

          {activeSection === 'gorsellestirme_3d' && <ThreeDVisualization />}

        </div>
      </main>
      
      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white py-8 px-6 flex justify-center mt-auto font-sans">
         <div className="max-w-[1270px] w-full flex flex-col sm:flex-row justify-between items-center gap-6">
           <div className="text-center sm:text-left">
             <p className="text-sm font-semibold text-gray-900">
               © {new Date().getFullYear()} Kastamonu Üniversitesi
             </p>
             <p className="text-xs text-gray-500 mt-1">
               Tüm hakları saklıdır. Bu arayüz TÜBİTAK 1001 Kapsamında Geliştirilmiştir.
             </p>
           </div>
           
           <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
             <div className="flex items-center gap-2">
               <div className="relative">
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                 <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75"></div>
               </div>
               <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Veritabanı Senkronize</span>
             </div>
             <span className="text-[11px] font-mono text-gray-400">DBF-2025 v1.6.0</span>
           </div>
         </div>
       </footer>
    </div>
  );
}
