import React, { useState } from 'react';
import { Upload, BrainCircuit, CheckCircle2, AlertCircle, Loader2, Sparkles, Send } from 'lucide-react';
import { CVData, Language } from '../types';
import { cn } from '../lib/utils';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Props {
  data: CVData;
  lang: Language;
  t: any;
}

export default function CVAiAnalysis({ data, lang, t }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [jobGoal, setJobGoal] = useState('');

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
    }
    return fullText;
  };

  const handleAnalyze = async () => {
    if (!file && !data.about) return;
    
    setIsAnalyzing(true);
    setResult(null);

    try {
      let cvContent = data.about;
      if (file) {
        cvContent = await extractTextFromPDF(file);
      }

      const response = await fetch('/api/analyze-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvContent,
          personInfo: { name: data.fullName, email: data.email },
          jobGoal,
          language: lang
        })
      });

      const resData = await response.json();
      if (!response.ok || resData.success === false) {
        throw new Error(resData?.error?.message || "Analysis failed");
      }
      setResult(resData.text || JSON.stringify(resData.data || resData.structured || resData, null, 2));
    } catch (err) {
      console.error("Action failed. Sensitive CV data was not logged.");
      setResult("Error analyzing CV. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-indigo-600/10 p-8 rounded-[40px] border border-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-black mb-1 flex items-center gap-3 tracking-tighter">
                <Sparkles className="text-indigo-400" size={32} />
                {t.nav.analysis}
              </h2>
              <p className="text-slate-500 text-sm font-medium">{t.ai.uploadPrompt}</p>
            </div>
            <div className="hidden md:block bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-600/30">
               <BrainCircuit className="text-white" size={24} />
            </div>
          </div>

          <div className="mt-10 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Target Job Position</label>
              <input 
                type="text" 
                placeholder="e.g. Senior Software Engineer"
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                value={jobGoal}
                onChange={(e) => setJobGoal(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Current Resume (PDF)</label>
              <label className={cn(
                "flex items-center gap-3 px-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all h-[54px]",
                file ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-slate-800 hover:border-indigo-500/50 text-slate-500"
              )}>
                <Upload size={18} />
                <span className="text-xs font-bold truncate max-w-[150px]">
                  {file ? file.name : "Choose File"}
                </span>
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!file && !data.about)}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-[54px] rounded-2xl font-black shadow-xl shadow-indigo-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" /> : <Send size={18} />}
              {t.ai.analyze}
            </button>
          </div>
        </div>
        {/* Background blobs */}
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -z-0"></div>
      </div>

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-24 animate-pulse">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
            <BrainCircuit size={80} className="text-indigo-500 mb-6 animate-bounce relative z-10" />
          </div>
          <p className="text-xl font-black text-slate-400 tracking-tight uppercase">{t.ai.waiting}</p>
        </div>
      )}

      {result && (
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" />
              {t.ai.results}
            </h3>
            <span className="text-[10px] font-bold bg-slate-800 text-slate-500 px-3 py-1 rounded-full border border-slate-700">AI INSIGHTS</span>
          </div>
          
          <div className="space-y-6">
             <div className="p-5 bg-slate-800/40 rounded-2xl border-l-4 border-indigo-500">
                <p className="text-xs text-slate-300 font-bold uppercase tracking-wider mb-2">Detailed Analysis</p>
                <div className="text-sm leading-relaxed text-slate-400 font-medium whitespace-pre-wrap">
                  {result}
                </div>
              </div>
          </div>

          <button 
            onClick={() => setResult(null)}
            className="w-full mt-10 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-4 rounded-3xl text-xs font-black tracking-[0.2em] transition-all uppercase"
          >
            Run Another Analysis
          </button>
        </div>
      )}
    </div>
  );
}
