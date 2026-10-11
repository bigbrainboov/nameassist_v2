/* SIRI.DEV */
import React from 'react';
import { ArrowRight, CirclePlay, Globe2, ShieldCheck, Users } from 'lucide-react';
interface HeroProps { onStartApplication: () => void; onHowItWorks: () => void; }
export const Hero: React.FC<HeroProps> = ({ onStartApplication, onHowItWorks }) => (
  <section id="hero" className="overflow-hidden bg-gradient-to-br from-white via-white to-[#EDF7F2]">
    <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-4 items-center pt-10 lg:pt-14">
      <div className="relative z-10 pb-8 lg:pb-16">
        <p className="text-[11px] sm:text-xs font-semibold tracking-[.12em] uppercase text-[#006747] mb-5">Identity & documentation services for Nigerians worldwide</p>
        <h1 className="text-5xl sm:text-6xl xl:text-7xl font-semibold tracking-[-.055em] leading-[1.06] mb-6">Your Name.<br />Your Identity.<br /><span className="text-[#006747]">Our Support.</span></h1>
        <p className="max-w-md text-base sm:text-lg text-[#53645D] leading-relaxed">We help Nigerians at home and abroad change their names, correct documents and handle official documentation with ease, professionalism and trust.</p>
        <div className="flex flex-wrap gap-3 mt-7">
          <button onClick={onStartApplication} className="bg-[#006747] hover:bg-[#004E36] text-white rounded-md px-6 py-3.5 text-sm font-medium flex items-center gap-5">Start My Application <ArrowRight size={17} /></button>
          <button onClick={onHowItWorks} className="border border-[#006747] text-[#006747] rounded-md px-5 py-3.5 text-sm font-medium flex items-center gap-2"><CirclePlay size={19} /> How It Works</button>
        </div>
        <div className="flex flex-wrap gap-7 sm:gap-10 mt-10 pt-6 border-t border-[#006747]/10">
          {[[Users,'Personal','Expert support'],[Globe2,'Worldwide','Nigeria & diaspora'],[ShieldCheck,'With you','At every step']].map(([Icon,title,label]) => { const Mark = Icon as typeof Users; return <div key={String(title)} className="flex items-center gap-3"><Mark size={27} className="text-[#006747]"/><div><strong className="block text-sm">{String(title)}</strong><span className="text-xs text-[#53645D]">{String(label)}</span></div></div>; })}
        </div>
      </div>
      <div id="diaspora" className="relative h-[440px] sm:h-[530px] lg:h-[590px] isolate">
        <div className="absolute w-[90%] aspect-square rounded-full bg-[#E2F2E9] -z-10 bottom-0 left-[5%]" />
        <Globe2 className="absolute top-0 right-3 w-64 h-64 text-[#CFE7DA]/40 -z-10" strokeWidth={.4}/>
        <img src="/assets/nameassist-hero.png" alt="Smiling NameAssist representative holding a tablet" width={1143} height={1373} fetchPriority="high" className="h-full w-full object-contain object-bottom" />
        <div className="absolute top-5 right-0 sm:right-3 text-[#006747] italic text-lg leading-tight rotate-[-7deg]">Same name.<br/>New opportunities.</div>
        <div className="absolute right-0 bottom-24 bg-white/95 shadow-lg shadow-green-950/5 rounded-xl p-4 border border-[#006747]/5 max-w-[175px]"><div className="flex gap-2 items-center"><span className="text-3xl">🇳🇬</span><span className="font-semibold text-sm leading-snug">For Nigerians<br/>Worldwide</span></div><div className="border-t border-gray-100 mt-3 pt-3 text-xl tracking-widest">🇬🇧 🇺🇸 🇨🇦<br/>🇦🇺 🇩🇪 <span className="text-[10px] tracking-normal text-gray-500">& more</span></div></div>
      </div>
    </div>
  </section>
);
