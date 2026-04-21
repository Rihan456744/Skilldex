import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, MapPin, Clock, DollarSign, ChevronRight, ArrowLeft, Upload, Send, CheckCircle, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { analyzeResume } from "@/lib/resumeParser";
import { extractResumePayload } from "@/lib/resumeUpload";

interface DBJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  screening_questions: any[];
  created_at: string;
}

const JobBoard = () => {
  const [jobs, setJobs] = useState<DBJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<DBJob | null>(null);
  const [step, setStep] = useState<"list" | "questions" | "upload" | "done">("list");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false });
      setJobs((data as any[]) || []);
      setLoading(false);
    };
    fetchJobs();
  }, []);

  const startApply = (job: DBJob) => {
    if (!user) {
      toast.error("Please sign in to apply for jobs");
      navigate("/auth");
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

      if (canAnalyze) {
        try {
          const { data } = await supabase.functions.invoke("analyze-resume", { body: { resumeText: analysisText } });
          if (typeof data?.score === "number") {
            score = data.score;
          } else {
            score = analyzeResume(analysisText).score;
          }
        } catch {
          const analysis = analyzeResume(analysisText);
          score = analysis.score;
        }
      }

      const applicationId = crypto.randomUUID();
      const applicantName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonymous";

      const { error } = await supabase.from("applications").insert({
        id: applicationId,
        job_id: selectedJob.id,
        user_id: user.id,
        answers,
        resume_text: storageText,
        resume_score: score,
        applicant_name: applicantName,
      });

      if (error) {
        toast.error("Failed to submit: " + error.message);
        return;
      }

      // Send notification to recruiter
      const { data: jobData } = await supabase.from("jobs").select("recruiter_id").eq("id", selectedJob.id).single();
      if (jobData?.recruiter_id) {
        await (supabase as any).from("notifications").insert({
          recruiter_id: jobData.recruiter_id,
          job_id: selectedJob.id,
          application_id: applicationId,
          message: applicantName + ' applied for "' + selectedJob.title + '" with an ATS score of ' + score + '/100',
        });
      }

      handleStepChange("done");
      toast.success("Application submitted!");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSelectedJob(null);
    handleStepChange("list");
    setAnswers({});
    setResumeFile(null);
  };

  const scrollToJobs = () => {
    document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleStepChange = (newStep: typeof step) => {
    setStep(newStep);
    setTimeout(scrollToJobs, 100);
  };

  return (
    <div className="py-20 px-4 min-h-[400px]">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-4">
            <Briefcase className="w-4 h-4" />
            Job Board
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-3">Find Your <span className="gradient-text">Next Role</span></h2>
          <p className="text-muted-foreground max-w-md mx-auto">Apply with pre-screening questions and let your resume speak for you.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "list" && (
            <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading jobs...</div>
              ) : jobs.length === 0 ? (
                <div className="card-glass rounded-2xl p-12 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No job openings at the moment. Check back soon!</p>
                </div>
              ) : jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="card-glass rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => startApply(job)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-lg group-hover:text-primary transition-colors text-foreground">{job.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{job.company}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.type}</span>
                        {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{job.salary}</span>}
                      </div>
                    </div>
                    {!user ? (
                      <LogIn className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {step === "questions" && selectedJob && (
            <motion.div key="questions" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <button onClick={reset} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to jobs
              </button>
              <div className="card-glass rounded-2xl p-6 mb-6">
                <h3 className="font-display font-semibold text-xl mb-1 text-foreground">{selectedJob.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedJob.company} • {selectedJob.location}</p>
                {selectedJob.description && <p className="text-sm text-secondary-foreground mt-3">{selectedJob.description}</p>}
              </div>
              <div className="card-glass rounded-2xl p-6 space-y-6">
                <h4 className="font-display font-semibold text-foreground">Pre-Screening Questions</h4>
                {questions.map((q: any, i: number) => (
                  <div key={q.id}>
                    <label className="text-sm font-medium mb-2 block text-foreground">{i + 1}. {q.question}</label>
                    <textarea
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-full bg-input border border-border rounded-lg p-3 text-sm text-foreground resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Your answer..."
                    />
                  </div>
                ))}
                <button
                  onClick={() => allAnswered && handleStepChange("upload")}
                  disabled={!allAnswered}
                  className="w-full py-3 rounded-xl font-display font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-primary-foreground"
                  style={allAnswered ? { background: "var(--gradient-primary)" } : { background: "hsl(var(--muted))" }}
                >
                  Continue to Resume Upload
                </button>
              </div>
            </motion.div>
          )}

          {step === "upload" && selectedJob && (
            <motion.div key="upload" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <button onClick={() => handleStepChange("questions")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to questions
              </button>
              <div className="card-glass rounded-2xl p-8 text-center">
                <h4 className="font-display font-semibold text-xl mb-6 text-foreground">Upload Your Resume</h4>
                <label
                  htmlFor="job-resume-input"
                  className="border-2 border-dashed border-border rounded-xl p-10 cursor-pointer hover:border-primary/40 transition-colors block"
                >
                  <input id="job-resume-input" type="file" accept=".txt,.pdf,.doc,.docx" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { setResumeFile(f); e.target.value = ""; } }} />
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  {resumeFile ? (
                    <p className="text-sm text-primary font-medium">{resumeFile.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Click to upload your resume</p>
                  )}
                </label>
                <button
                  onClick={submitApplication}
                  disabled={!resumeFile || submitting}
                  className="mt-6 w-full py-3 rounded-xl font-display font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-primary-foreground"
                  style={resumeFile ? { background: "var(--gradient-primary)" } : { background: "hsl(var(--muted))" }}
                >
                  <Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card-glass rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-success/15">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-2 text-foreground">Application Submitted!</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Your application for <strong className="text-foreground">{selectedJob?.title}</strong> at {selectedJob?.company} has been submitted and scored.
              </p>
              <button onClick={reset} className="px-6 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors text-foreground">
                Browse More Jobs
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JobBoard;
