import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, MapPin, Clock, DollarSign, ChevronRight, ArrowLeft, Upload, Send, CheckCircle, LogIn, Crown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { analyzeResume } from "@/lib/resumeParser";
import { extractResumePayload } from "@/lib/resumeUpload";

interface DBJob { id: string; title: string; company: string; location: string; type: string; salary: string; description: string; screening_questions: any[]; created_at: string; }

const JobBoard = () => {
  const [jobs, setJobs] = useState<DBJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<DBJob | null>(null);
  const [step, setStep] = useState<"list" | "questions" | "upload" | "done">("list");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Subscription states
  const [activePlan, setActivePlan] = useState<string>("free");
  const [monthlyAppsCount, setMonthlyAppsCount] = useState(0);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false });
      setJobs((data as any[]) || []);
      setLoading(false);
    };
    fetchJobs();

    if (user) {
      // Check Plan & Monthly App limits
      const checkAccess = async () => {
        const { data: cust } = await supabase.from('billing_customers').select('id').eq('user_id', user.id).maybeSingle();
        if (cust) {
          const { data: sub } = await supabase.from('billing_subscriptions').select('plan_name, status').eq('billing_customer_id', cust.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (sub && sub.status === 'active') setActivePlan(sub.plan_name);
        }

        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startOfMonth);
        setMonthlyAppsCount(count || 0);
      };
      checkAccess();
    }
  }, [user]);

  const startApply = (job: DBJob) => {
    if (!user) { toast.error("Please sign in to apply for jobs"); navigate("/auth"); return; }
    
    if (activePlan === 'free' && monthlyAppsCount >= 5) {
       toast.error("Free Limit Reached: You have already applied to 5 jobs this month. Upgrade to Pro for unlimited applications.");
       document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
       return;
    }

    setSelectedJob(job);
    handleStepChange("questions");
    setAnswers({});
    setResumeFile(null);
  };

  const questions = (selectedJob?.screening_questions as any[]) || [];
  const allAnswered = questions.every(q => answers[q.id]?.trim());

  const submitApplication = async () => {
    if (!selectedJob || !resumeFile || !user) return;
    setSubmitting(true);
    try {
      const { analysisText, storageText, canAnalyze } = await extractResumePayload(resumeFile);
      let score = 50;
      if (canAnalyze) score = analyzeResume(analysisText).score;

      // Premium users get Priority Status tagged in their answers payload secretly
      const finalAnswers = (activePlan === 'pro' || activePlan === 'enterprise') 
        ? { ...answers, _isPriorityApplicant: true } 
        : answers;

      const applicationId = crypto.randomUUID();
      const applicantName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonymous";

      const { error } = await supabase.from("applications").insert({
        id: applicationId, job_id: selectedJob.id, user_id: user.id,
        answers: finalAnswers, resume_text: storageText, resume_score: score, applicant_name: applicantName,
      });

      if (error) { toast.error("Failed to submit: " + error.message); return; }

      // Increment local count instantly
      setMonthlyAppsCount(prev => prev + 1);

      handleStepChange("done");
      toast.success("Application submitted!");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => { setSelectedJob(null); handleStepChange("list"); setAnswers({}); setResumeFile(null); };
  const scrollToJobs = () => document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const handleStepChange = (newStep: typeof step) => { setStep(newStep); setTimeout(scrollToJobs, 100); };

  return (
    <div className="py-20 px-4 min-h-[400px]">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-4">
            <Briefcase className="w-4 h-4" /> Job Board
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-3">Find Your <span className="gradient-text">Next Role</span></h2>
          {user && activePlan === 'free' && <p className="text-muted-foreground font-medium mb-2">Free Applications Remaining: {Math.max(0, 5 - monthlyAppsCount)}/5</p>}
          {user && activePlan !== 'free' && <p className="text-success text-sm font-medium flex items-center justify-center gap-1"><Sparkles className="w-4 h-4"/> Unlimited Priority Applications Active</p>}
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "list" && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading jobs...</div>
              ) : jobs.length === 0 ? (
                 <div className="text-center py-12 text-muted-foreground">No active jobs found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {jobs.map((job, i) => (
                    <motion.div 
                      key={job.id} 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: i * 0.05 }}
                      onClick={() => startApply(job)} 
                      className="bg-card border border-border/60 hover:border-primary/40 shadow-sm hover:shadow-lg rounded-2xl p-6 cursor-pointer group flex flex-col relative overflow-hidden transition-all hover:-translate-y-1"
                    >
                      {/* Left accent border on hover */}
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                      
                      <div className="flex justify-between items-start mb-4 pl-2">
                        <div>
                          <h3 className="font-display font-semibold text-lg group-hover:text-primary transition-colors text-foreground line-clamp-1">{job.title}</h3>
                          <p className="text-sm font-medium text-muted-foreground mt-1">{job.company}</p>
                        </div>
                        <div className="bg-primary/10 text-primary p-2.5 rounded-xl shrink-0 ml-3">
                          <Briefcase className="w-4 h-4" />
                        </div>
                      </div>
                      
                      <div className="mt-auto pl-2">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-xs font-medium text-secondary-foreground border border-border/50">
                            <MapPin className="w-3.5 h-3.5" /> {job.location}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-xs font-medium text-secondary-foreground border border-border/50">
                            <Clock className="w-3.5 h-3.5" /> {job.type}
                          </span>
                          {job.salary && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 text-xs font-medium text-success border border-success/20">
                              <DollarSign className="w-3.5 h-3.5" /> {job.salary}
                            </span>
                          )}
                        </div>
                        
                        {/* Bottom Row */}
                        <div className="flex items-center justify-between border-t border-border/50 pt-4">
                          <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">
                            {(job.screening_questions as any[])?.length || 0} Questions
                          </span>
                          <span className="text-sm font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Apply Now <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === "questions" && selectedJob && (
            <motion.div key="questions" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
               <button onClick={reset} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to jobs
              </button>
              <div className="card-glass rounded-2xl p-6 space-y-6">
                <h4 className="font-display font-semibold text-foreground">Pre-Screening Questions</h4>
                {questions.map((q: any, i: number) => (
                  <div key={q.id}>
                    <label className="text-sm font-medium mb-2 block text-foreground">{i + 1}. {q.question}</label>
                    <textarea value={answers[q.id] || ""} onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} className="w-full bg-input border border-border rounded-lg p-3 text-sm text-foreground resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Your answer..." />
                  </div>
                ))}
                <button onClick={() => allAnswered && handleStepChange("upload")} disabled={!allAnswered} className="w-full py-3 rounded-xl font-display font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-primary-foreground" style={allAnswered ? { background: "var(--gradient-primary)" } : { background: "hsl(var(--muted))" }}>
                  Continue to Resume Upload
                </button>
              </div>
            </motion.div>
          )}

          {step === "upload" && selectedJob && (
            <motion.div key="upload" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
              <div className="card-glass rounded-2xl p-8 text-center">
                <h4 className="font-display font-semibold text-xl mb-6 text-foreground">Upload Your Resume</h4>
                <label className="border-2 border-dashed border-border rounded-xl p-10 cursor-pointer block">
                  <input type="file" accept=".txt,.pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { setResumeFile(e.target.files[0]); } }} />
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm">{resumeFile ? resumeFile.name : "Click to upload resume"}</p>
                </label>
                <button onClick={submitApplication} disabled={!resumeFile || submitting} className="mt-6 w-full py-3 rounded-xl font-display font-semibold text-sm flex items-center justify-center gap-2 text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-primary)" }}>
                  <Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done" className="card-glass rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-success/15"><CheckCircle className="w-8 h-8 text-success" /></div>
              <h3 className="text-2xl font-display font-bold mb-2">Application Submitted!</h3>
              {activePlan !== 'free' && <p className="text-primary font-semibold text-sm mb-2"><Crown className="w-4 h-4 inline mr-1"/> Submitted with Priority Status</p>}
              <button onClick={reset} className="mt-4 px-6 py-2.5 rounded-xl border border-border text-sm font-medium">Browse More Jobs</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JobBoard;