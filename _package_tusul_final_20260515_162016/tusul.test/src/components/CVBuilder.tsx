import React, { useState } from 'react';
import { 
  Plus, Trash2, Search, Upload, BookOpen, Briefcase, 
  Award, Globe, Monitor, PenTool, Trophy, Download 
} from 'lucide-react';
import { 
  CVData, Language, COMPUTER_SKILLS_OPTIONS, 
  ART_SKILLS_OPTIONS, SPORT_SKILLS_OPTIONS, 
  DRIVING_LICENSE_OPTIONS 
} from '../types';
import { cn } from '../lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const UNIVERSITIES = [
  "National University of Mongolia",
  "Mongolian University of Science and Technology",
  "Health Sciences University of Mongolia",
  "Mongolian State University of Education",
  "Mongolian University of Life Sciences",
  "National Academy of Governance",
  "Harvard University",
  "Stanford University",
  "MIT",
  "University of Oxford",
  "University of Cambridge",
  "ETH Zurich",
  "National University of Singapore",
  "Tsinghua University",
  "Seoul National University",
  "University of Tokyo"
];

interface Props {
  data: CVData;
  setData: React.Dispatch<React.SetStateAction<CVData>>;
  lang: Language;
  t: any;
}

type TextInputProps = {
  label: string;
  type?: React.HTMLInputTypeAttribute;
  value: string;
  onChange: (value: string) => void;
};

type SelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export default function CVBuilder({ data, setData, lang, t }: Props) {
  const [uniSearch, setUniSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const updateData = (field: keyof CVData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: keyof CVData, item: string) => {
    const currentList = data[field] as string[];
    if (currentList.includes(item)) {
      updateData(field, currentList.filter(i => i !== item));
    } else {
      updateData(field, [...currentList, item]);
    }
  };

  const addItem = (field: 'educations' | 'experiences') => {
    if (field === 'educations') {
      updateData(field, [...data.educations, { id: Date.now().toString(), university: '', degree: '', startYear: '', endYear: '' }]);
    } else {
      updateData(field, [...data.experiences, { id: Date.now().toString(), company: '', position: '', duration: '', description: '' }]);
    }
  };

  const removeItem = (field: 'educations' | 'experiences', id: string) => {
    updateData(field, (data[field] as any[]).filter(item => item.id !== id));
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById('cv-preview-container');
    if (!element) {
      setIsExporting(false);
      return;
    }

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.fullName || 'CV'}_CareerAI.pdf`);
    } catch (err) {
      console.error("Action failed. Sensitive CV data was not logged.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
      {/* Form Section */}
      <div className="space-y-8 h-[calc(100vh-80px)] overflow-y-auto pr-4 custom-scrollbar lg:sticky lg:top-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-black tracking-tight">{t.nav.builder}</h2>
          <div className="flex gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Editing Mode</span>
          </div>
        </div>

        {/* Personal Info */}
        <section className="sleek-card bg-slate-900/40">
          <h3 className="text-xs font-black uppercase text-indigo-400 mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Search size={14} /> 1. {t.form.personalInfo}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label={t.form.fullName} value={data.fullName} onChange={(v) => updateData('fullName', v)} />
            <Input label={t.form.email} value={data.email} onChange={(v) => updateData('email', v)} />
            <Input label={t.form.phone} value={data.phone} onChange={(v) => updateData('phone', v)} />
            <Input label={t.form.birthDate} type="date" value={data.birthDate} onChange={(v) => updateData('birthDate', v)} />
            <Input label={t.form.location} value={data.location} onChange={(v) => updateData('location', v)} />
            <Select 
              label={t.form.drivingLicense} 
              value={data.drivingLicense} 
              options={DRIVING_LICENSE_OPTIONS} 
              onChange={(v) => updateData('drivingLicense', v)} 
            />
          </div>
          <div className="mt-6">
            <TextArea label={t.form.about} value={data.about} onChange={(v) => updateData('about', v)} />
          </div>
        </section>

        {/* Education */}
        <section className="sleek-card bg-slate-900/40">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-black uppercase text-indigo-400 flex items-center gap-2">
              <BookOpen size={14} /> 2. {t.form.education}
            </h3>
            <button onClick={() => addItem('educations')} className="bg-indigo-600/20 text-indigo-400 p-1 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
              <Plus size={16} />
            </button>
          </div>
          {data.educations.map((edu, idx) => (
            <div key={edu.id} className="mb-6 last:mb-0 p-5 bg-slate-950/50 rounded-2xl border border-slate-800 relative group">
              <button 
                onClick={() => removeItem('educations', edu.id)}
                className="absolute top-4 right-4 text-slate-600 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
              <div className="space-y-4">
                <div className="relative">
                  <Input 
                    label={t.form.universitySearch} 
                    value={edu.university} 
                    onChange={(v) => {
                      const newList = [...data.educations];
                      newList[idx].university = v;
                      updateData('educations', newList);
                      setUniSearch(v);
                    }} 
                  />
                  {uniSearch && idx === data.educations.length - 1 && (
                    <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto backdrop-blur-xl">
                      {UNIVERSITIES.filter(u => u.toLowerCase().includes(uniSearch.toLowerCase())).map(u => (
                        <div 
                          key={u} 
                          className="px-4 py-3 hover:bg-indigo-600/20 hover:text-indigo-300 cursor-pointer text-sm transition-colors border-b border-slate-800 last:border-0"
                          onClick={() => {
                            const newList = [...data.educations];
                            newList[idx].university = u;
                            updateData('educations', newList);
                            setUniSearch('');
                          }}
                        >
                          {u}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Input 
                  label="Degree" 
                  value={edu.degree} 
                  onChange={(v) => {
                    const newList = [...data.educations];
                    newList[idx].degree = v;
                    updateData('educations', newList);
                  }} 
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Start Year" value={edu.startYear} onChange={(v) => {
                    const newList = [...data.educations];
                    newList[idx].startYear = v;
                    updateData('educations', newList);
                  }} />
                  <Input label="End Year" value={edu.endYear} onChange={(v) => {
                    const newList = [...data.educations];
                    newList[idx].endYear = v;
                    updateData('educations', newList);
                  }} />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Skills */}
        <section className="sleek-card bg-slate-900/40 space-y-8">
          <div>
            <h3 className="text-xs font-black uppercase text-indigo-400 mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Monitor size={14} /> 3. {t.form.computerSkills}
            </h3>
            <div className="flex flex-wrap gap-2">
              {COMPUTER_SKILLS_OPTIONS.map(skill => (
                <Badge 
                  key={skill} 
                  label={skill} 
                  active={data.computerSkills.includes(skill)} 
                  onClick={() => handleArrayToggle('computerSkills', skill)} 
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-indigo-400 mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
              <PenTool size={14} /> 4. {t.form.artSkills}
            </h3>
            <div className="flex flex-wrap gap-2">
              {ART_SKILLS_OPTIONS.map(skill => (
                <Badge 
                  key={skill} 
                  label={skill} 
                  active={data.artSkills.includes(skill)} 
                  onClick={() => handleArrayToggle('artSkills', skill)} 
                />
              ))}
            </div>
          </div>
        </section>

        {/* File Uploads */}
        <section className="sleek-card bg-slate-900/40">
          <h3 className="text-xs font-black uppercase text-indigo-400 mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Award size={14} /> 5. {t.form.exams}
          </h3>
          <FileUpload onUpload={(file) => updateData('exams', [...data.exams, file.name])} label={t.form.fileUpload} />
          {data.exams.length > 0 && (
            <div className="mt-4 space-y-2">
              {data.exams.map(name => (
                <div key={name} className="flex items-center justify-between text-[11px] bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-300 font-medium">{name}</span>
                  <button onClick={() => updateData('exams', data.exams.filter(f => f !== name))} className="text-rose-500/70 hover:text-rose-500"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Preview Section */}
      <div className="relative group lg:h-[calc(100vh-80px)] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">{isExporting ? 'Generating PDF...' : 'Live Preview'}</h3>
          <button 
            onClick={exportToPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isExporting ? <Search className="animate-spin" size={20} /> : <Download size={20} />}
            {t.export}
          </button>
        </div>
        
        <div 
          id="cv-preview-container" 
          className="bg-white text-black p-12 shadow-2xl rounded-[40px] origin-top h-full overflow-y-auto w-full scale-95 hover:scale-100 transition-transform duration-500 custom-scrollbar relative border border-slate-800/5"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* Professional CV Header */}
          <div className="border-b-[6px] border-indigo-600 pb-8 mb-10 flex justify-between items-end">
            <div className="max-w-[70%]">
              <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-950 leading-[0.95]">
                {data.fullName || "Your Name"}
              </h1>
              <p className="mt-4 text-indigo-600 font-black uppercase tracking-[0.3em] text-xs">
                {data.interestedJobs.join(" & ") || "Your Vision"}
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-500 space-y-1 font-bold uppercase tracking-wider">
              {data.email && <p className="text-slate-950">{data.email}</p>}
              {data.phone && <p>{data.phone}</p>}
              {data.location && <p>{data.location}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-12">
            {/* Sidebar */}
            <div className="col-span-1 space-y-10 border-r border-slate-100 pr-6">
              {data.languages.length > 0 && (
                <section>
                  <h4 className="text-[11px] font-black uppercase text-slate-950 mb-4 border-b-2 border-slate-900 pb-1 w-fit pr-4">Expertise</h4>
                  <ul className="text-[11px] space-y-1.5 text-slate-600 font-medium">
                    {data.languages.map(l => <li key={l}>• {l}</li>)}
                  </ul>
                </section>
              )}

              {(data.computerSkills.length > 0 || data.artSkills.length > 0) && (
                <section>
                  <h4 className="text-[11px] font-black uppercase text-slate-950 mb-4 border-b-2 border-slate-900 pb-1 w-fit pr-4">Skills</h4>
                  <div className="space-y-6">
                    {data.computerSkills.length > 0 && (
                      <div>
                        <ul className="text-[11px] space-y-1.5 text-slate-600 font-medium">
                          {data.computerSkills.slice(0, 8).map(s => <li key={s}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Main Column */}
            <div className="col-span-2 space-y-10">
              {data.about && (
                <section>
                  <h4 className="text-xs font-black uppercase text-slate-950 mb-4 tracking-widest">• Profile</h4>
                  <p className="text-xs leading-relaxed text-slate-700 font-medium italic border-l-4 border-indigo-600 pl-4 py-1">"{data.about}"</p>
                </section>
              )}

              {data.educations.length > 0 && (
                <section>
                  <h4 className="text-xs font-black uppercase text-slate-950 mb-4 tracking-widest">• Education</h4>
                  {data.educations.map(edu => (
                    <div key={edu.id} className="mb-6">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className="font-black text-sm text-slate-950 uppercase">{edu.university}</p>
                        <p className="text-[10px] text-indigo-600 font-black">{edu.startYear} — {edu.endYear}</p>
                      </div>
                      <p className="text-xs text-slate-500 font-bold italic">{edu.degree}</p>
                    </div>
                  ))}
                </section>
              )}
            </div>
          </div>
          
          {/* Footer watermark */}
          <div className="absolute bottom-8 left-12 right-12 flex justify-between border-t border-slate-100 pt-4 opacity-20">
            <span className="text-[8px] font-black uppercase">Created with CareerFlow AI</span>
            <span className="text-[8px] font-black uppercase">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function Input({ label, type = "text", value, onChange }: TextInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] ml-1">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="sleek-input"
      />
    </div>
  );
}

function TextArea({ label, value, onChange }: Omit<TextInputProps, 'type'>) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] ml-1">{label}</label>
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="sleek-input resize-none"
      />
    </div>
  );
}

function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] ml-1">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="sleek-input cursor-pointer appearance-none"
      >
        {options.map((o: string) => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
      </select>
    </div>
  );
}

function Badge({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-[11px] font-bold transition-all border",
        active 
          ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30 shadow-lg shadow-indigo-600/5" 
          : "bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-700"
      )}
    >
      {label}
    </button>
  );
}

function FileUpload({ onUpload, label }: { onUpload: (file: File) => void; label: string }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onUpload(e.target.files[0]);
  };
  return (
    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[var(--muted)] rounded-2xl hover:border-primary cursor-pointer transition-all">
      <Upload size={20} className="text-secondary" />
      <span className="text-sm font-bold text-secondary">{label}</span>
      <input type="file" className="hidden" onChange={handleChange} />
    </label>
  );
}
