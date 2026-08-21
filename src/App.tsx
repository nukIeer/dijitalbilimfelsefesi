import { useEffect, useState } from 'react';
import { Search, Info, Map, Network, Box, Globe, BarChart2, Globe2, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';
import SpatialAnalysis from './components/SpatialAnalysis';
import TextAnalysis from './components/TextAnalysis';
import PhilosophyNetwork from './components/PhilosophyNetwork';
import LiteratureArchive from './components/LiteratureArchive';
import ThreeDVisualization from './components/ThreeDVisualization';
import siteContent from './METINLERI_DUZENLE.json';

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
              {siteContent.university}
            </span>
            <span className="font-sans text-[10px] tracking-widest text-[#8A1538] uppercase font-semibold mt-1">
              {siteContent.project.program} Projesi ({siteContent.project.number})
            </span>
          </div>

          <div className="flex w-full overflow-x-auto gap-2 bg-white/50 p-1 rounded-lg border border-gray-200/60 shadow-sm custom-scrollbar pb-1">
             <NavButton section="hakkinda" icon={Info} label={siteContent.navigation.about} />
             <NavButton section="literatur_arsivi" icon={Search} label={siteContent.navigation.literature} />
             <div className="w-px h-6 bg-gray-200 my-auto mx-1 shrink-0"></div>
             <NavButton section="metin_analizi" icon={BarChart2} label={siteContent.navigation.textAnalysis} />
             <NavButton section="mekansal_analiz" icon={Globe2} label={siteContent.navigation.spatialAnalysis} />
             <NavButton section="network_analizi" icon={Network} label={siteContent.navigation.networkAnalysis} />
             <NavButton section="gorsellestirme_3d" icon={Box} label={siteContent.navigation.visualization3d} />
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
                    <h4 className="text-sm font-sans font-bold text-[#8A1538] tracking-widest uppercase mb-4">{siteContent.project.program} Projesi (No: {siteContent.project.number})</h4>
                    <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.15]">
                      {siteContent.project.title}
                    </h1>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-4">
                   <div className="flex flex-col gap-2">
                     <span className="text-xs font-sans font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2">{siteContent.labels.projectManager}</span>
                     <span className="text-base font-serif font-semibold text-gray-900">{siteContent.team[0].name}</span>
                   </div>
                   <div className="flex flex-col gap-2">
                     <span className="text-xs font-sans font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2">{siteContent.labels.institution}</span>
                     <span className="text-base font-serif font-semibold text-gray-900">{siteContent.university}</span>
                   </div>
                   <div className="flex flex-col gap-2">
                     <span className="text-xs font-sans font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2">{siteContent.labels.focus}</span>
                     <span className="text-base font-serif font-normal italic text-gray-700">{siteContent.project.focus}</span>
                   </div>
                 </div>
                 
                 <div className="flex flex-wrap gap-3 mt-2">
                   {siteContent.tags.map(tag => (
                     <span key={tag} className="px-3 py-1 font-sans text-xs tracking-wide uppercase text-gray-600 border border-gray-300">
                       {tag}
                     </span>
                   ))}
                 </div>
               </section>

               {/* Proje Hakkında */}
               <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
                 <div className="lg:col-span-7 flex flex-col gap-6">
                   <h2 className="font-serif text-3xl font-bold text-gray-900">{siteContent.about.heading}</h2>
                   <div className="font-sans text-[17px] leading-relaxed text-gray-700 space-y-6">
                     {siteContent.about.paragraphs.map((paragraph, index) => (
                       <p key={paragraph} className={index === 0 ? 'first-letter:text-6xl first-letter:font-serif first-letter:font-bold first-letter:text-[#8A1538] first-letter:float-left first-letter:mr-3 first-letter:mt-1' : undefined}>
                         {paragraph}
                       </p>
                     ))}
                   </div>
                 </div>
                 
                 <div className="lg:col-span-5 flex flex-col gap-8 border-l border-gray-200 pl-0 lg:pl-12">
                    {siteContent.highlights.map(item => (
                      <div key={item.title} className="flex flex-col gap-2">
                        <span className="font-serif font-bold text-xl text-gray-900">{item.title}</span>
                        <p className="font-sans text-sm leading-relaxed text-gray-600">{item.description}</p>
                      </div>
                    ))}
                 </div>
               </section>

               {/* Ana Konular */}
               <section className="flex flex-col gap-10 bg-white p-8 md:p-16 border border-gray-200 shadow-sm">
                 <div className="text-center md:text-left">
                    <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">{siteContent.researchAreasHeading}</h2>
                    <p className="font-sans text-gray-500">{siteContent.researchAreasIntro}</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {siteContent.researchAreas.map((area, i) => (
                      <div key={area.title} className="flex gap-4">
                        <div className="font-serif text-3xl font-bold text-gray-300">0{i+1}</div>
                        <div className="flex flex-col gap-2 mt-1">
                          <h4 className="font-serif text-xl font-bold text-gray-900">{area.title}</h4>
                          <p className="font-sans text-[15px] leading-relaxed text-gray-600">{area.description}</p>
                        </div>
                      </div>
                    ))}
                 </div>
               </section>

               <section className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
                 <div className="flex flex-col gap-6">
                   <h3 className="font-serif text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4">{siteContent.labels.academicStaff}</h3>
                   <div className="flex flex-col gap-6">
                     {siteContent.team.map(member => (
                       <div key={member.name} className="flex items-start gap-5">
                         <div className="flex flex-col gap-1">
                           <h4 className="font-serif font-bold text-lg text-gray-900">{member.name}</h4>
                           <span className="font-sans text-[11px] font-bold text-[#8A1538] uppercase tracking-widest">{member.role}</span>
                           <div className="font-sans text-[14px] text-gray-600 mt-2 leading-relaxed">
                             <p>{siteContent.department}</p>
                             {'specialty' in member && <p className="mt-3 text-gray-800 text-sm font-medium">{member.specialty}</p>}
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 <div className="flex flex-col gap-6">
                   <h3 className="font-serif text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4">{siteContent.labels.contact}</h3>
                   <div className="flex flex-col gap-6">
                     <div className="font-sans">
                       <p className="text-[15px] text-gray-800 leading-relaxed">
                         {siteContent.department}<br />
                         {siteContent.contact.location}
                       </p>
                     </div>
                     <div>
                       <a href={`mailto:${siteContent.contact.email}`} className="font-sans text-[16px] font-semibold text-[#8A1538] hover:text-black transition-colors underline underline-offset-4">
                         {siteContent.contact.email}
                       </a>
                       <p className="font-sans text-[13px] text-gray-500 mt-2 italic">
                         {siteContent.contact.note}
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
               © {new Date().getFullYear()} {siteContent.university}
             </p>
             <p className="text-xs text-gray-500 mt-1">
               {siteContent.footer}
             </p>
           </div>
           
           <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
             <div className="flex items-center gap-2">
               <div className="relative">
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                 <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75"></div>
               </div>
               <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">{siteContent.labels.databaseSynchronized}</span>
             </div>
             <span className="text-[11px] font-mono text-gray-400">DBF-2025 v1.6.0</span>
           </div>
         </div>
       </footer>
    </div>
  );
}
