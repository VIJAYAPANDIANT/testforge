import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PlaySquare,
  Sparkles,
  Zap,
  Code2,
  Cpu,
  GitBranch,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Activity,
  Layers,
  ChevronRight,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-300">
      {/* ─── Top Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.jpg" alt="TestForge Logo" className="h-8 w-auto rounded-md shadow-md" />
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              TestForge <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">MVP</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a>
            <a href="#architecture" className="hover:text-blue-400 transition-colors">Architecture</a>
            <a href="#tech-stack" className="hover:text-blue-400 transition-colors">Tech Stack</a>
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="btn-primary flex items-center space-x-2 text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all font-medium shadow-lg shadow-blue-600/20"
              >
                <Activity className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-slate-300 hover:text-white font-medium px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all shadow-md shadow-blue-600/20 flex items-center space-x-1.5"
                >
                  <span>Sign Up</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          {/* Tagline Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-medium backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Enterprise No-Code Web Test Automation & AI Diagnosis Platform</span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 leading-[1.15]">
            Build Visual Browser Tests.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-300">
              Diagnose Failures with AI.
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
            TestForge converts visual test workflows into structured JSON DSL, compiles them into production-ready Playwright TypeScript scripts, executes headless Chromium workers, streams live real-time status events, and diagnoses failures using Google Gemini AI.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base rounded-xl transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center space-x-2"
              >
                <Activity className="w-5 h-5" />
                <span>Launch Workspace Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base rounded-xl transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center space-x-2 group"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-base rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Sign In to Platform</span>
                </Link>
              </>
            )}
          </div>

          {/* Enterprise Badges */}
          <div className="pt-10 border-t border-slate-800/60 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center justify-center space-x-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>117/117 Tests Passing</span>
            </div>
            <div className="flex items-center justify-center space-x-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>Socket.IO Streaming</span>
            </div>
            <div className="flex items-center justify-center space-x-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>Playwright Codegen</span>
            </div>
            <div className="flex items-center justify-center space-x-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Gemini 2.5 Flash AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works (Start to End Workflow) ────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-[#0d1322] border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">
              Complete End-to-End Workflow
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-100">
              From Visual Workflow to AI Failure Diagnosis
            </h3>
            <p className="text-slate-400 text-sm sm:text-base">
              See how TestForge automates web application testing from start to end without requiring manual Playwright code scripting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 relative flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
                  01
                </div>
                <h4 className="text-lg font-semibold text-slate-100">Visual Test Builder</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Drag and drop action steps (Navigate, Click, Fill, Assert Visible, Assert Text, Wait, Screenshot) with instant property inspection.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-mono text-slate-500 flex items-center space-x-1">
                <PlaySquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Visual Canvas Builder</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 relative flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  02
                </div>
                <h4 className="text-lg font-semibold text-slate-100">DSL & Codegen Compiler</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Validates test JSON DSL schema via Ajv and compiles it into executable Playwright TypeScript (`.spec.ts`) scripts.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-mono text-slate-500 flex items-center space-x-1">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>@testforge/codegen</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 relative flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  03
                </div>
                <h4 className="text-lg font-semibold text-slate-100">Headless Execution</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Spawns worker process in headless Chromium, logs step events, and streams real-time execution updates via Socket.IO.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-mono text-slate-500 flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Playwright + Socket.IO</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 relative flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-sm">
                  04
                </div>
                <h4 className="text-lg font-semibold text-slate-100">AI Failure Diagnosis</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Redacts sensitive credentials, feeds error contexts to Google Gemini AI, and provides root cause analysis & fixes.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-mono text-slate-500 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Google Gemini 2.5 Flash</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Platform Key Features ───────────────────────────────────────────── */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">
              Core Capabilities
            </h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-100">
              Built for Software Teams & QA Engineers
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-slate-100">Visual Drag & Drop Builder</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Build test workflows with 7 supported action types, custom locator strategies (role, text, CSS), step reordering, and instant validation.
              </p>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-slate-100">Real-Time Event Streaming</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Watch test steps execute live with status transitions (`queued` ➔ `running` ➔ `passed` / `failed`) powered by WebSockets.
              </p>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-slate-100">AI Failure Diagnosis</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                One-click Gemini AI diagnosis analyzes error tracebacks, console logs, and failure screenshots to explain root causes and recommended code fixes.
              </p>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <GitBranch className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-slate-100">GitHub Webhook Automation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Trigger test suite executions automatically on GitHub code pushes with HMAC SHA-256 signature verification and branch filtering.
              </p>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-slate-100">Security & Credential Redaction</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatic sanitization redacts passwords, JWT tokens, Bearer headers, and API keys before sending context to AI models.
              </p>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center">
                <Terminal className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-slate-100">Failure Screenshots & History</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Captures failure screenshots automatically, records detailed execution timelines, and maintains complete test run history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom Call to Action ───────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-b from-[#0b0f19] to-[#0d1322] border-t border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-extrabold text-slate-100">
            Start Automating Web Tests with TestForge Today
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Create an account or sign in to build visual browser tests, run automated test suites, and diagnose test failures with AI.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2"
              >
                <span>Go to Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2"
                >
                  <span>Create Account</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm rounded-xl"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-8 bg-[#090c14] border-t border-slate-800/80 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <img src="/logo.jpg" alt="TestForge" className="w-5 h-5 rounded" />
            <span className="font-semibold text-slate-300">TestForge</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center space-x-6 text-slate-400 font-mono text-[11px]">
            <span>React 18</span>
            <span>Playwright 1.44</span>
            <span>Socket.IO 4.8</span>
            <span>Gemini AI 2.5</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
