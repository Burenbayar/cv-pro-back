import React, { useState } from 'react';
import { Briefcase, Brain, ArrowRight, Star, Loader2, Compass } from 'lucide-react';
import { CVData, Language } from '../types';
import { motion } from 'motion/react';

interface Props {
  data: CVData;
  lang: Language;
  t: any;
}

export default function CareerRecommendation({ data, lang, t }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<string | null>(null);

  const generatePath = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/career-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: [...data.computerSkills, ...data.artSkills, ...data.languages],
          interests: data.interestedJobs,
          education: data.educations,
          language: lang
        })
      });
      const resData = await response.json();
      setRecommendations(resData.text);
    } catch (err) {
      console.error("Action failed. Sensitive CV data was not logged.");
      setRecommendations("Could not generate recommendations. Check your internet or API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl text-primary mb-2">
          <Compass size={40} className="animate-spin-slow" />
        </div>
        <h2 className="text-4xl font-black tracking-tight">{t.nav.recommend}</h2>
        <p className="text-secondary">{t.ai.waiting.replace('...', '')}</p>
      </div>

      <div className="bg-indigo-600/10 p-12 rounded-[50px] border border-indigo-500/20 text-center relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent -z-0"></div>
        
        {!recommendations && !isGenerating && (
          <div className="space-y-8 relative z-10">
            <div className="flex justify-center gap-3">
              {['Strategy', 'Growth', 'Future'].map(label => (
                <div key={label} className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">{label}</div>
              ))}
            </div>
            <p className="text-base text-slate-400 leading-relaxed max-w-lg mx-auto font-medium lowercase first-letter:uppercase">
              Based on your skills in <span className="text-slate-200 font-bold underline decoration-indigo-500/50 decoration-2 underline-offset-4">{data.computerSkills.slice(0, 3).join(", ") || "the workforce"}</span> and interest in <span className="text-slate-200 font-bold underline decoration-indigo-500/50 decoration-2 underline-offset-4">{data.interestedJobs[0] || "professional development"}</span>, AI can architect a tailored 24-month roadmap.
            </p>
            <button 
              onClick={generatePath}
              className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 mx-auto uppercase tracking-tighter"
            >
              <Brain size={28} />
              Architect My Path
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="py-12 space-y-8 relative z-10">
            <div className="relative flex justify-center">
              <div className="absolute inset-0 bg-indigo-500/30 blur-[60px] rounded-full scale-150 animate-pulse"></div>
              <Compass size={80} className="text-indigo-400 animate-spin-slow relative z-10" />
            </div>
            <p className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-slate-400 animate-pulse uppercase tracking-[0.2em]">Processing market vectors...</p>
          </div>
        )}

        {recommendations && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left bg-slate-950 border border-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
              <Star size={160} className="text-indigo-500" />
            </div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-900 pb-6">
                <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400 border border-indigo-500/20"><Star size={24} /></div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Market Realignment Path</h3>
                  <p className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">Generated by CareerFlow AI</p>
                </div>
              </div>
              <div className="text-sm leading-[1.8] text-slate-400 font-medium whitespace-pre-wrap border-l-2 border-slate-800 pl-8">
                {recommendations}
              </div>
              <button 
                onClick={() => setRecommendations(null)}
                className="mt-4 text-[10px] font-black text-indigo-400 flex items-center gap-2 hover:gap-4 transition-all uppercase tracking-widest bg-slate-900 px-6 py-3 rounded-full border border-slate-800"
              >
                Reset Exploration <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <MetricCard label="Market Alignment" value="84%" />
        <MetricCard label="Next Milestone" value="Cert" />
        <MetricCard label="Growth Pot." value="High" />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-6 bg-[var(--bg)] border border-[var(--muted)] rounded-2xl">
      <p className="text-[10px] font-black uppercase text-secondary tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}
