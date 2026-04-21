import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle2, XCircle, Lightbulb, ChevronDown, ChevronUp, Search, Sparkles, Loader2, LogIn } from "lucide-react";
import ATSScoreCircle from "./ATSScoreCircle";
import { supabase } from "@/integrations/supabase/client";
import { analyzeResume as analyzeResumeLocal, type ResumeAnalysis } from "@/lib/resumeParser";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const ResumeScanner = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("pros");
  const [dragActive, setDragActive] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setAnalyzing(true);
    setResult(null);
    try {
      const text = await f.text();
      const { data, error } = await supabase.functions.invoke("analyze-resume", { body: { resumeText: text } });
      if (error || data?.error) {
        const analysis = analyzeResumeLocal(text);
        setResult(analysis);
      } else {
        setResult(data as ResumeAnalysis);
      }
    } catch {
      try {
        const text = await f.text();
        setResult(analyzeResumeLocal(text));
      } catch {
        setResult({
          score: 25, pros: ["File uploaded"], cons: ["Could not parse"], recommendations: ["Use .txt format"],
          keywords: { found: [], missing: ["experience", "skills", "education"] },
          sections: [{ name: "Contact", found: false }, { name: "Experience", found: false }, { name: "Skills", found: false }],
        });
      }
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const toggle = (s: string) => setExpandedSection(expandedSection === s ? null : s);

  // Gate: require login
  if (!user) {
    return (
      <section id="scanner" className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <Search className="w-4 h-4" />
              AI-Powered ATS Scanner
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-3">
              Check Your <span className="gradient-text">ATS Score</span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Upload your resume and get AI-powered feedback on ATS compatibility, strengths, and improvements.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="card-glass rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-primary/10">
              <LogIn className="w-9 h-9 text-primary" />
            </div>
            <h3 className="text-xl font-display font-semibold mb-2 text-foreground">Sign in to scan your resume</h3>
            <p className="text-muted-foreground text-sm mb-6">Create a free account to access the AI-powered ATS scanner.</p>
            <button onClick={() => navigate("/auth")}
              className="px-8 py-3 rounded-lg font-display font-semibold text-sm text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}>
              Sign In to Continue
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="scanner" className="py-20 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Search className="w-4 h-4" />
            AI-Powered ATS Scanner
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-3">
            Check Your <span className="gradient-text">ATS Score</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Upload your resume and get AI-powered feedback on ATS compatibility.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!result && !analyzing && (
            <motion.div key="upload" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className={`relative card-glass rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${dragActive ? "border-primary glow-effect" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById("resume-upload")?.click()}>
              <input id="resume-upload" type="file" accept=".txt,.pdf,.doc,.docx" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="animate-float">
                <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                  <Upload className="w-9 h-9 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-display font-semibold mb-2 text-foreground">Drop your resume here</h3>
              <p className="text-muted-foreground text-sm mb-4">or click to browse • .txt, .pdf, .doc, .docx</p>
              <p className="text-xs text-muted-foreground/60">For best results, use a .txt file</p>
            </motion.div>
          )}

          {analyzing && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="card-glass rounded-2xl p-16 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <Loader2 className="w-20 h-20 text-primary animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2 text-foreground">AI is Analyzing Your Resume...</h3>
              <p className="text-muted-foreground text-sm">Deep scanning for ATS compatibility, keywords, and structure</p>
            </motion.div>
          )}

          {result && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="card-glass rounded-2xl p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <ATSScoreCircle score={result.score} />
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">{file?.name}</span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">
                      {result.score >= 75 ? "Great resume! Strong ATS compatibility." : result.score >= 50 ? "Good start, room for improvement." : "Needs significant improvements for ATS."}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {result.sections.map(s => (
                        <span key={s.name} className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.found ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                          {s.found ? "✓" : "✗"} {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <CollapsibleSection title="Strengths" count={result.pros.length} icon={<CheckCircle2 className="w-4 h-4 text-success" />}
                iconBg="bg-success/15" expanded={expandedSection === "pros"} onToggle={() => toggle("pros")} dotColor="text-success" items={result.pros} />
              <CollapsibleSection title="Weaknesses" count={result.cons.length} icon={<XCircle className="w-4 h-4 text-destructive" />}
                iconBg="bg-destructive/15" expanded={expandedSection === "cons"} onToggle={() => toggle("cons")} dotColor="text-destructive" items={result.cons} />
              <CollapsibleSection title="Recommendations" count={result.recommendations.length} icon={<Lightbulb className="w-4 h-4 text-warning" />}
                iconBg="bg-warning/15" expanded={expandedSection === "recs"} onToggle={() => toggle("recs")} dotColor="text-warning" items={result.recommendations} prefix="→" />

              <div className="card-glass rounded-2xl p-5">
                <h4 className="font-display font-semibold mb-4 text-foreground">Keyword Analysis</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-success font-medium mb-2 uppercase tracking-wider">Found Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.keywords.found.slice(0, 12).map(k => (
                        <span key={k} className="text-xs px-2 py-0.5 rounded-md bg-success/10 text-success border border-success/20">{k}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-destructive font-medium mb-2 uppercase tracking-wider">Missing Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.keywords.missing.map(k => (
                        <span key={k} className="text-xs px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20">{k}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => { setResult(null); setFile(null); }}
                className="w-full py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                Scan Another Resume
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

interface CollapsibleSectionProps {
  title: string; count: number; icon: React.ReactNode; iconBg: string;
  expanded: boolean; onToggle: () => void; dotColor: string; items: string[]; prefix?: string;
}

const CollapsibleSection = ({ title, count, icon, iconBg, expanded, onToggle, dotColor, items, prefix = "•" }: CollapsibleSectionProps) => (
  <div className="card-glass rounded-2xl overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center justify-between p-5">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>{icon}</div>
        <span className="font-display font-semibold text-foreground">{title} ({count})</span>
      </div>
      {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
    </button>
    <AnimatePresence>
      {expanded && (
        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
          <div className="px-5 pb-5 space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
                <span className={`${dotColor} mt-0.5`}>{prefix}</span> {item}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default ResumeScanner;
