import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  Award,
  Lock,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PublicNavbar from "../common/PublicNavbar";

const PublicFeed = () => {
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="min-h-screen bg-slate-50 font-body-md relative">
      {/* Header */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-light text-white py-24 sm:py-32 border-b border-primary-light">
        {/* Background Decorative Blobs */}
        <div className="absolute inset-0 pattern-overlay opacity-[0.03]"></div>
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-accent/15 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-accent text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Academic Collaboration Hub</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight font-display-lg">
            Connect. Share. Collaborate. <br />
            <span className="bg-gradient-to-r from-accent via-[#60A5FA] to-white bg-clip-text text-transparent">
              Advance Academic Science
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed font-body-md font-medium">
            Scholar Sync is the social and collaborative network designed for researchers, students, and academics. Publish preprints, participate in peer discussions, and form dedicated research teams.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-4 bg-secondary hover:bg-blue-700 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer w-full sm:w-auto text-sm flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Join Scholar Sync</span>
            </button>
            <button
              onClick={() => setShowToast(true)}
              className="px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-full font-semibold hover:border-white/45 shadow-sm hover:shadow transition-all duration-200 cursor-pointer w-full sm:w-auto text-sm flex items-center justify-center gap-2"
            >
              <span>Explore Latest Activity</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Quick Grid */}
      <section className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "5,000+", label: "Active Scholars", icon: Users, color: "text-blue-500" },
            { value: "12,000+", label: "Papers Published", icon: BookOpen, color: "text-emerald-500" },
            { value: "450+", label: "Collaborative Projects", icon: Award, color: "text-amber-500" },
            { value: "25,000+", label: "Discussions & Likes", icon: MessageSquare, color: "text-rose-500" },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-lg flex items-center gap-4 hover:shadow-xl transition-all duration-300">
                <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-bold text-slate-900 leading-none mb-1">{stat.value}</h4>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Key Features Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 font-headline-lg">
            Designed for Modern Academic Workflows
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto font-body-md">
            Explore the specialized features built specifically to streamline scientific knowledge sharing and network creation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1 */}
          <div className="glass-card p-8 rounded-3xl border border-slate-100 bg-white shadow-md flex gap-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Research Repository</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Upload and publish preprints, journal drafts, and conference files. Allow colleagues to read, download, and review your publications instantly.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-8 rounded-3xl border border-slate-100 bg-white shadow-md flex gap-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Academic Discussions</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Post comments, raise questions, and engage in real-time scholastic debates. Connect with fellow experts globally to discuss research findings.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-8 rounded-3xl border border-slate-100 bg-white shadow-md flex gap-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Project Collaboration</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Start or join collaborative research projects. Post milestones, co-author documents, and find research partners across universities.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-8 rounded-3xl border border-slate-100 bg-white shadow-md flex gap-5">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Academic Presence</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Build a verified scholar profile. Showcase your curriculum vitae, active projects, publication list, and grow your professional presence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-slate-100/60 py-20 border-t border-b border-slate-200/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4 font-headline-lg">
              Start Redefining Your Research Journey
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto font-body-md">
              Getting started on Scholar Sync takes only a few minutes. Follow these three steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              { step: "01", title: "Create Your Account", desc: "Sign up with your academic or professional email, choose your research fields, and fill out your portfolio profile." },
              { step: "02", title: "Share & Discuss Work", desc: "Upload PDFs of papers or start project listings. Engage the community with insightful comments and discussions." },
              { step: "03", title: "Form Collaborations", desc: "Connect with interested academics, message them, and create private or public collaborative project spaces." }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200/50 p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <span className="text-5xl font-extrabold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent block mb-4 leading-none">
                     {item.step}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Scholar Sync (Benefits Grid) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4 font-headline-lg">
            Why Choose Scholar Sync?
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto font-body-md">
            Join a platform built strictly around the needs of the academic and research community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Safe & Credible</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              We foster a professional scholarly environment. Profiles are built around academic institutions and real publications.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Real-Time Networking</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Discuss findings instantly. Receive feedback on preprints, share updates, and communicate seamlessly via private chat messages.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Open Access First</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Scholar Sync believes in barrier-free research dissemination. Discover and share scientific publications with zero paywalls.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Callout */}
      <section className="bg-gradient-to-br from-primary-dark to-primary py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-[0.03]"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight font-display-lg">
            Ready to Accelerate Your Collaborative Reach?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mb-10 max-w-xl mx-auto leading-relaxed">
            Create your account today, highlight your publications, and connect with peers globally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-3.5 bg-white text-primary hover:bg-slate-100 rounded-full font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer w-full sm:w-auto text-sm"
            >
              Sign Up for Free
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3.5 border border-slate-700 text-white rounded-full font-semibold hover:bg-white/5 hover:border-slate-500 transition-all duration-200 cursor-pointer w-full sm:w-auto text-sm"
            >
              Log In
            </button>
          </div>
        </div>
      </section>

      {/* Premium Sleek Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-50 max-w-md w-[calc(100%-3rem)] sm:w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-2xl transition-all duration-300 ease-out flex items-start gap-3.5 transform ${
          showToast
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-10 opacity-0 scale-95 pointer-events-none"
        }`}
        role="alert"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#00A6FB] border border-blue-100 dark:border-blue-800/50 shadow-sm">
          <Lock className="w-5 h-5" />
        </div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Authentication Required
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Authentication required. Please{" "}
            <button
              onClick={() => {
                setShowToast(false);
                navigate("/register");
              }}
              className="text-[#00A6FB] hover:text-[#0086cc] font-bold underline transition-colors focus:outline-none"
            >
              Sign Up
            </button>{" "}
            to explore live academic activity.
          </p>
        </div>
        <button
          onClick={() => setShowToast(false)}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all focus:outline-none"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
};

export default PublicFeed;
