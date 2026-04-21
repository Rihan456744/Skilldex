import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Mail } from "lucide-react";
import logo from "@/assets/skilldex-logo.png";
import { useState } from "react";

interface SiteFooterProps {
  onNavigate: (section: string) => void;
}

const SiteFooter = ({ onNavigate }: SiteFooterProps) => {
  const { isRecruiter, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const linkClass =
    "text-sm text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer block";

  return (
    <footer className="bg-[hsl(220,20%,10%)] text-gray-300">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand + Newsletter */}
          <div className="md:col-span-4 space-y-5">
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="Skilldex"
                className="h-7 brightness-0 invert opacity-90"
              />
            </div>

            {/* Newsletter */}
            <div className="flex items-center border border-white/20 rounded-lg overflow-hidden max-w-xs">
              <div className="px-3 text-gray-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to receive updates"
                className="flex-1 bg-transparent text-sm text-gray-300 placeholder:text-gray-500 py-2.5 pr-3 outline-none"
              />
            </div>

            <p className="text-xs text-gray-500">Connect with us</p>
            <div className="flex gap-3">
              {["𝕏", "f", "📷", "◎", "Bē"].map((icon, i) => (
                <span
                  key={i}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white text-sm hover:bg-white/20 transition-colors cursor-pointer"
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>

          {/* The Project */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-white mb-4">
              The Project
            </h4>
            <ul className="space-y-2.5">
              <li>
                <span className={linkClass}>About</span>
              </li>
              <li>
                <span className={linkClass}>Blog</span>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("scanner")}
                  className={linkClass}
                >
                  Resume Scanner
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("jobs")}
                  className={linkClass}
                >
                  Job Board
                </button>
              </li>
              {isRecruiter && (
                <li>
                  <button
                    onClick={() => navigate("/recruiter")}
                    className={linkClass}
                  >
                    Dashboard
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Learn More */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-white mb-4">
              Learn More
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => onNavigate("plans")}
                  className={linkClass}
                >
                  Pricing
                </button>
              </li>
              <li>
                <span className={linkClass}>How It Works</span>
              </li>
              <li>
                <span className={linkClass}>AI Features</span>
              </li>
              <li>
                <span className={linkClass}>API</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2.5">
              <li>
                <span className={linkClass}>Contact</span>
              </li>
              <li>
                <span className={linkClass}>FAQ</span>
              </li>
              <li>
                <span className={linkClass}>Terms of Use</span>
              </li>
              <li>
                <span className={linkClass}>Privacy Policy</span>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-white mb-4">Account</h4>
            <ul className="space-y-2.5">
              {user ? (
                <>
                  <li>
                    <button
                      onClick={() => navigate("/profile")}
                      className={linkClass}
                    >
                      My Profile
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <button
                    onClick={() => navigate("/auth")}
                    className={linkClass}
                  >
                    Sign In
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => navigate("/auth")}
                  className={linkClass}
                >
                  Recruiter Login
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © 2026 Skilldex. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Built with AI • Crafted for talent
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
