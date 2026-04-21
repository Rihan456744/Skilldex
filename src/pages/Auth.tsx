import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import logo from "@/assets/skilldex-logo.png";

console.log("My Supabase URL is:", import.meta.env.VITE_SUPABASE_URL);

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) { toast.error(error); return; }
        toast.success("Welcome back!");
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) { toast.error(error); return; }
        toast.success("Account created successfully!");
      }
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute top-20 right-20 w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)" }} />
        <div className="absolute bottom-20 left-20 w-[300px] h-[300px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, hsl(var(--accent)), transparent 70%)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img src={logo} alt="Skilldex" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "Sign in to access resume scanner & jobs" : "Join Skilldex to scan resumes and find jobs"}
          </p>
        </div>

        <div className="card-glass rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-display font-semibold text-sm text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "var(--gradient-primary)" }}
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
              ) : isLogin ? (
                <><LogIn className="w-4 h-4" /> Sign In</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Create Account</>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
