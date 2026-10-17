import React, { useState, useEffect } from 'react';
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
  Menu,
  X,
  Play,
  RotateCcw,
  Globe,
  Camera,
  Clock,
  Check,
  AlertTriangle,
  Server,
  Database,
  Monitor,
  Workflow,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

// Sample demonstration steps for the Interactive Automation Preview
interface DemoStep {
  id: number;
  type: 'navigate' | 'fill' | 'click' | 'assertVisible';
  typeLabel: string;
  target: string;
  value?: string;
  summary: string;
  status: 'passed' | 'running' | 'idle';
  duration: string;
  browserView: {
    url: string;
    actionHighlight: string;
    screenTitle: string;
  };
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    type: 'navigate',
    typeLabel: 'Navigate',
    target: 'https://app.shopdemo.com/login',
    summary: 'Open application authentication portal',
    status: 'passed',
    duration: '320ms',
    browserView: {
      url: 'https://app.shopdemo.com/login',
      actionHighlight: 'Loading portal page: https://app.shopdemo.com/login',
      screenTitle: 'Customer Sign In',
    },
  },
  {
    id: 2,
    type: 'fill',
    typeLabel: 'Fill',
    target: 'input[name="email"]',
    value: 'user@company.com',
    summary: 'Fill email textbox with user@company.com',
    status: 'passed',
    duration: '110ms',
    browserView: {
      url: 'https://app.shopdemo.com/login',
      actionHighlight: 'Focused & typed into email field: user@company.com',
      screenTitle: 'Entering Credentials...',
    },
  },
  {
    id: 3,
    type: 'fill',
    typeLabel: 'Fill',
    target: 'input[name="password"]',
    value: '••••••••••••',
    summary: 'Fill password textbox with secured secret',
    status: 'passed',
    duration: '95ms',
    browserView: {
      url: 'https://app.shopdemo.com/login',
      actionHighlight: 'Focused & typed password into password field',
      screenTitle: 'Credentials Ready',
    },
  },
  {
    id: 4,
    type: 'click',
    typeLabel: 'Click',
    target: 'button[type="submit"]',
    value: 'Sign In',
    summary: 'Click submit button with role="button" name="Sign In"',
    status: 'passed',
    duration: '450ms',
    browserView: {
      url: 'https://app.shopdemo.com/login',
      actionHighlight: 'Dispatched Click event on role="button" "Sign In"',
      screenTitle: 'Authenticating with Backend...',
    },
  },
  {
    id: 5,
    type: 'assertVisible',
    typeLabel: 'Assert Visible',
    target: '.dashboard-overview',
    summary: 'Verify dashboard overview element is rendered and visible',
    status: 'passed',
    duration: '180ms',
    browserView: {
      url: 'https://app.shopdemo.com/dashboard',
      actionHighlight: 'Verified .dashboard-overview element is in DOM & visible',
      screenTitle: 'Dashboard Overview Verified ✓',
    },
  },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Demo State
  const [activeStepIndex, setActiveStepIndex] = useState<number>(4); // default: finished at step 5
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedProgress, setSimulatedProgress] = useState<number>(5);

  // Auto-simulation handler
  const handleRunSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulatedProgress(0);
    setActiveStepIndex(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setSimulatedProgress(current);
      setActiveStepIndex(current - 1);

      if (current >= DEMO_STEPS.length) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 800);
  };

  const activeStep = DEMO_STEPS[activeStepIndex] || DEMO_STEPS[0];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-300">
      {/* ─── A. Sticky Navigation Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              navigate('/');
            }}
          >
            <img
              src="/logo.jpg"
              alt="TestForge Logo"
              className="h-8 w-8 rounded-lg border border-blue-500/30 object-cover shadow-sm group-hover:border-blue-500/60 transition-colors"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                TestForge
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                Platform
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-semibold text-slate-300">
            <a
              href="#features"
              className="hover:text-blue-400 transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-blue-400 transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              How It Works
            </a>
            <a
              href="#architecture"
              className="hover:text-blue-400 transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              Architecture
            </a>
            <a
              href="#tech-stack"
              className="hover:text-blue-400 transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              Tech Stack
            </a>
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden sm:flex items-center space-x-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="btn-primary flex items-center space-x-2 text-xs px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all font-semibold shadow-md shadow-blue-600/20 focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs text-slate-300 hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-xs px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all shadow-md shadow-blue-600/20 flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <span>Sign Up</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-[#0e1424] px-4 pt-3 pb-5 space-y-4 shadow-2xl">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-300">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-800/70 hover:text-blue-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-800/70 hover:text-blue-400 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-800/70 hover:text-blue-400 transition-colors"
              >
                Architecture
              </a>
              <a
                href="#tech-stack"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-800/70 hover:text-blue-400 transition-colors"
              >
                Tech Stack
              </a>
            </nav>

            <div className="pt-2 border-t border-slate-800/80 flex flex-col space-y-2">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold text-center flex items-center justify-center space-x-2 shadow-md shadow-blue-600/20"
                >
                  <Activity className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold text-center flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/20"
                  >
                    <span>Sign Up Free</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold text-center"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─── B. Hero Section (Two-Column Desktop Layout) ─────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28 border-b border-slate-800/70">
        {/* Subtle background ambient lights */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[350px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[300px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline, Description, CTAs, Benefits */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Product Badge */}
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-300 text-xs font-medium backdrop-blur-sm shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
                <span>Enterprise Visual Browser Test Automation & AI Platform</span>
              </div>

              {/* Exact Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-100 leading-[1.15]">
                Build Visual Browser Tests.{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-300">
                  Diagnose Failures with AI.
                </span>
              </h1>

              {/* Exact Supporting Text */}
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl font-normal">
                TestForge converts visual test workflows into structured JSON DSL, generates Playwright TypeScript scripts, executes browser tests in Chromium, and helps diagnose failures using AI.
              </p>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Launch Workspace Dashboard</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center space-x-2 group focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      <span>Get Started Free</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <a
                      href="#how-it-works"
                      className="px-5 py-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      <span>Explore How It Works</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </a>
                  </>
                )}
              </div>

              {/* Verified Platform Badges */}
              <div className="pt-6 border-t border-slate-800/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono text-slate-400">
                <div className="flex items-center space-x-1.5 bg-slate-900/60 px-2.5 py-2 rounded-lg border border-slate-800/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>117/117 Tests</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-900/60 px-2.5 py-2 rounded-lg border border-slate-800/60">
                  <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>WebSockets</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-900/60 px-2.5 py-2 rounded-lg border border-slate-800/60">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Playwright</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-900/60 px-2.5 py-2 rounded-lg border border-slate-800/60">
                  <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Gemini AI</span>
                </div>
              </div>
            </div>

            {/* Right Column: C. Interactive Automation Workspace Preview */}
            <div className="lg:col-span-6 w-full">
              <div className="bg-[#101626] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Preview Window Header & Tag */}
                <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-[11px] font-mono text-slate-400 ml-2 font-medium">
                      testforge-automation-canvas
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono">
                      Interactive Demo • Sample Workflow
                    </span>
                    <button
                      onClick={handleRunSimulation}
                      disabled={isSimulating}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center space-x-1 transition-all disabled:opacity-50"
                      title="Run Demo Simulation"
                    >
                      {isSimulating ? (
                        <>
                          <RotateCcw className="w-3 h-3 animate-spin" />
                          <span>Simulating...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Run Demo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Step Library Palette Bar */}
                <div className="bg-slate-950/70 border-b border-slate-800/70 px-4 py-2 flex items-center space-x-2 overflow-x-auto text-[11px] scrollbar-none">
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider shrink-0 mr-1">
                    Step Palette:
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                    Navigate
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                    Fill
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
                    Click
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                    Assert Visible
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                    Assert Text
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                    Wait
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                    Screenshot
                  </span>
                </div>

                {/* Main Interactive Demo Area */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Left sub-panel: The 5-Step Workflow */}
                  <div className="md:col-span-7 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1">
                      <span className="flex items-center space-x-1.5">
                        <Workflow className="w-3.5 h-3.5 text-blue-400" />
                        <span>Workflow: Login & Smoke Check</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {simulatedProgress >= 5 ? '5/5 Passed' : `${simulatedProgress}/5 Running`}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {DEMO_STEPS.map((step, idx) => {
                        const isCurrentActive = idx === activeStepIndex;
                        const isPassed = idx < simulatedProgress;

                        return (
                          <div
                            key={step.id}
                            onClick={() => setActiveStepIndex(idx)}
                            className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                              isCurrentActive
                                ? 'bg-blue-600/15 border-blue-500/60 shadow-md shadow-blue-500/5'
                                : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 overflow-hidden">
                              <span
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${
                                  isPassed
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {isPassed ? '✓' : idx + 1}
                              </span>

                              <div className="truncate">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-semibold text-slate-200">{step.typeLabel}</span>
                                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                                    {step.target}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate">{step.summary}</p>
                              </div>
                            </div>

                            <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                              {step.duration}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right sub-panel: Mini Browser Preview & Run Result */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-3">
                    {/* Simulated Browser Viewport */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col h-full">
                      <div className="bg-slate-900/80 px-2.5 py-1.5 border-b border-slate-800/80 flex items-center space-x-1.5">
                        <Lock className="w-2.5 h-2.5 text-emerald-400" />
                        <span className="text-[9px] font-mono text-slate-300 truncate">
                          {activeStep.browserView.url}
                        </span>
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-center items-center text-center space-y-2 bg-gradient-to-b from-slate-950 to-slate-900/60">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
                          <Monitor className="w-4 h-4" />
                        </div>
                        <div className="text-[11px] font-bold text-slate-200">
                          {activeStep.browserView.screenTitle}
                        </div>
                        <div className="text-[9px] font-mono text-blue-300/80 bg-blue-950/40 border border-blue-500/20 px-2 py-1 rounded max-w-[180px] break-words">
                          {activeStep.browserView.actionHighlight}
                        </div>
                      </div>
                    </div>

                    {/* Result Summary Card */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          Execution Result
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono">
                          Passed
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300 font-mono text-[10px] pt-1">
                        <span>Duration: 1.42s</span>
                        <span>Chromium Worker</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── D. Product Feature Section ───────────────────────────────────────── */}
      <section id="features" className="py-20 bg-[#0e1322] border-b border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">
              Core Capabilities
            </h2>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-100">
              Built for Modern Software Teams & QA Engineers
            </h3>
            <p className="text-slate-400 text-sm">
              Construct resilient automated tests visually, run them in headless Chromium, and triage errors with AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#111827] border border-slate-800/80 hover:border-blue-500/40 rounded-xl p-6 space-y-3.5 transition-all shadow-lg hover:shadow-blue-500/5 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-600/25 transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                1. Visual Test Builder
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Create test steps visually without manually writing code scripts. Drag, drop, edit properties, configure resilient locators, and validate schemas instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#111827] border border-slate-800/80 hover:border-indigo-500/40 rounded-xl p-6 space-y-3.5 transition-all shadow-lg hover:shadow-indigo-500/5 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600/25 transition-colors">
                <Code2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                2. Playwright Code Generation
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically compiles JSON Domain Specific Language (DSL) into valid, production-ready Playwright TypeScript (<code className="text-indigo-300 font-mono">.spec.ts</code>) scripts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#111827] border border-slate-800/80 hover:border-emerald-500/40 rounded-xl p-6 space-y-3.5 transition-all shadow-lg hover:shadow-emerald-500/5 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600/25 transition-colors">
                <Monitor className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                3. Automated Browser Execution
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Spawns isolated worker processes to execute tests inside headless Chromium browsers, supporting baseUrl configurations and environmental isolation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#111827] border border-slate-800/80 hover:border-cyan-500/40 rounded-xl p-6 space-y-3.5 transition-all shadow-lg hover:shadow-cyan-500/5 group">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/15 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-600/25 transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                4. Live Execution Feedback
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Streams execution status transitions (<code className="text-cyan-300 font-mono">queued</code> ➔ <code className="text-cyan-300 font-mono">running</code> ➔ <code className="text-cyan-300 font-mono">passed/failed</code>) and stdout/stderr logs in real time via Socket.IO.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#111827] border border-slate-800/80 hover:border-amber-500/40 rounded-xl p-6 space-y-3.5 transition-all shadow-lg hover:shadow-amber-500/5 group">
              <div className="w-10 h-10 rounded-xl bg-amber-600/15 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:bg-amber-600/25 transition-colors">
                <Camera className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                5. Failure Screenshots
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Captures high-resolution browser viewport PNG screenshots at the exact instant a test step assertion fails, facilitating rapid visual inspection.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#111827] border border-slate-800/80 hover:border-purple-500/40 rounded-xl p-6 space-y-3.5 transition-all shadow-lg hover:shadow-purple-500/5 group">
              <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-600/25 transition-colors">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                6. AI Failure Diagnosis
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically sanitizes secrets to <code className="text-purple-300 font-mono">&lt;REDACTED&gt;</code> and calls Google Gemini 2.5 Flash to diagnose root causes and recommend actionable fixes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── E. How It Works Section ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 border-b border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">
              Automation Pipeline
            </h2>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-100">
              How TestForge Executes from Start to End
            </h3>
            <p className="text-slate-400 text-sm">
              The end-to-end journey from visual drag-and-drop authoring to headless execution and AI failure triage.
            </p>
          </div>

          {/* Workflow Chain: Visual Builder ➔ JSON DSL ➔ Code Generator ➔ Playwright Worker ➔ Chromium ➔ Test Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Step 1 */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-3 shadow-md hover:border-slate-700 transition-colors">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h4 className="text-sm font-bold text-slate-100">Visual Builder</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Compose browser actions with 7 step types and locator selectors.
                </p>
              </div>
              <div className="pt-2 text-[10px] font-mono text-blue-400/80 flex items-center space-x-1">
                <span>apps/client</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-3 shadow-md hover:border-slate-700 transition-colors">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h4 className="text-sm font-bold text-slate-100">JSON DSL</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Validates workflow data against the JSON Schema using Ajv.
                </p>
              </div>
              <div className="pt-2 text-[10px] font-mono text-indigo-400/80 flex items-center space-x-1">
                <span>@testforge/dsl-schema</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-3 shadow-md hover:border-slate-700 transition-colors">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h4 className="text-sm font-bold text-slate-100">Code Generator</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Compiles DSL JSON into clean, executable Playwright TypeScript.
                </p>
              </div>
              <div className="pt-2 text-[10px] font-mono text-cyan-400/80 flex items-center space-x-1">
                <span>@testforge/codegen</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-3 shadow-md hover:border-slate-700 transition-colors">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-sky-600/20 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold text-xs">
                  04
                </div>
                <h4 className="text-sm font-bold text-slate-100">Playwright Worker</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Spawns standalone worker process executing the generated script.
                </p>
              </div>
              <div className="pt-2 text-[10px] font-mono text-sky-400/80 flex items-center space-x-1">
                <span>apps/worker</span>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-3 shadow-md hover:border-slate-700 transition-colors">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  05
                </div>
                <h4 className="text-sm font-bold text-slate-100">Chromium</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automates real Chromium browser engine with live step status.
                </p>
              </div>
              <div className="pt-2 text-[10px] font-mono text-emerald-400/80 flex items-center space-x-1">
                <span>@playwright/test</span>
              </div>
            </div>

            {/* Step 6 */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-3 shadow-md hover:border-slate-700 transition-colors">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-xs">
                  06
                </div>
                <h4 className="text-sm font-bold text-slate-100">Test Results</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Persists Run & RunResult in MongoDB; triggers Gemini AI diagnosis if failed.
                </p>
              </div>
              <div className="pt-2 text-[10px] font-mono text-purple-400/80 flex items-center space-x-1">
                <span>MongoDB + Gemini AI</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── F. Architecture Section ─────────────────────────────────────────── */}
      <section id="architecture" className="py-20 bg-[#0e1322] border-b border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">
              System Architecture
            </h2>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-100">
              Verified Production Monorepo Design
            </h3>
            <p className="text-slate-400 text-sm">
              Strict modular separation across client, server, execution worker, schema validation, and codegen compiler.
            </p>
          </div>

          {/* Architecture Visual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Layer 1: Client & User Interface */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono flex items-center space-x-1.5">
                  <Monitor className="w-4 h-4" />
                  <span>Frontend Client Layer</span>
                </span>
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                  apps/client
                </span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>React 18 & Vite SPA</strong> with fast Hot Module Replacement</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Visual Test Builder</strong> with 7 drag-and-drop action blocks</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>Socket.IO Client</strong> streaming live step status transitions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span><strong>AI Failure Modal</strong> displaying Gemini root cause & code fixes</span>
                </li>
              </ul>
            </div>

            {/* Layer 2: Express Server & Monorepo Packages */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono flex items-center space-x-1.5">
                  <Server className="w-4 h-4" />
                  <span>Server & Core Packages</span>
                </span>
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                  apps/server
                </span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Express.js 4 REST API</strong> with JWT user authentication</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>@testforge/dsl-schema</strong> validating steps with Ajv</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>@testforge/codegen</strong> converting DSL to Playwright code</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>GitHub Webhook Receiver</strong> with HMAC SHA-256 verification</span>
                </li>
              </ul>
            </div>

            {/* Layer 3: Execution Worker & Data Store */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center space-x-1.5">
                  <Database className="w-4 h-4" />
                  <span>Worker & Data Layer</span>
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                  apps/worker & DB
                </span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Headless Chromium Worker</strong> executing Playwright test specs</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Automatic Screenshot Capture</strong> saving .png files on failure</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>MongoDB Atlas</strong> with Mongoose (User, Project, Run, RunResult)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Google Gemini 2.5 Flash</strong> with server-side secret sanitization</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── G. Tech Stack Section ───────────────────────────────────────────── */}
      <section id="tech-stack" className="py-20 border-b border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">
              Technology Stack
            </h2>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-100">
              Battle-Tested Technologies in Active Use
            </h3>
            <p className="text-slate-400 text-sm">
              Every tool and library listed below is integrated, verified, and passing tests in the repository.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl text-center space-y-2 hover:border-blue-500/30 transition-colors">
              <span className="text-[10px] uppercase font-bold text-blue-400 font-mono">Frontend</span>
              <h5 className="font-bold text-sm text-slate-100">React 18 + Vite</h5>
              <p className="text-[10px] text-slate-400">TypeScript SPA</p>
            </div>

            <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl text-center space-y-2 hover:border-indigo-500/30 transition-colors">
              <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono">Styling</span>
              <h5 className="font-bold text-sm text-slate-100">Tailwind CSS</h5>
              <p className="text-[10px] text-slate-400">Dark developer theme</p>
            </div>

            <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl text-center space-y-2 hover:border-cyan-500/30 transition-colors">
              <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono">Backend</span>
              <h5 className="font-bold text-sm text-slate-100">Node.js + Express</h5>
              <p className="text-[10px] text-slate-400">REST API & Auth</p>
            </div>

            <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl text-center space-y-2 hover:border-emerald-500/30 transition-colors">
              <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono">Database</span>
              <h5 className="font-bold text-sm text-slate-100">MongoDB Atlas</h5>
              <p className="text-[10px] text-slate-400">Mongoose ODM</p>
            </div>

            <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl text-center space-y-2 hover:border-purple-500/30 transition-colors">
              <span className="text-[10px] uppercase font-bold text-purple-400 font-mono">Automation</span>
              <h5 className="font-bold text-sm text-slate-100">Playwright 1.44</h5>
              <p className="text-[10px] text-slate-400">Headless Chromium</p>
            </div>

            <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl text-center space-y-2 hover:border-pink-500/30 transition-colors">
              <span className="text-[10px] uppercase font-bold text-pink-400 font-mono">AI Engine</span>
              <h5 className="font-bold text-sm text-slate-100">Gemini 2.5 Flash</h5>
              <p className="text-[10px] text-slate-400">Failure diagnosis</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── H. Final CTA & Footer ───────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-[#0b0f19] to-[#0e1424] border-b border-slate-800/70">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>Zero Manual Playwright Code Required</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Ready to simplify browser testing?
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Build test workflows visually, execute browser tests, and investigate failures from one workspace.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-xl shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Activity className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-xl shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all group focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <span>Start Building Tests</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Sign In to Platform
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-[#090c14] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5">
              <img src="/logo.jpg" alt="TestForge" className="w-6 h-6 rounded-md object-cover" />
              <span className="font-bold text-slate-300 text-sm">TestForge</span>
              <span className="text-slate-600">|</span>
              <span>No-Code Browser Test Automation Platform</span>
            </div>

            <div className="flex items-center space-x-6 text-slate-400">
              <a href="#features" className="hover:text-blue-400 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-blue-400 transition-colors">
                How It Works
              </a>
              <a href="#architecture" className="hover:text-blue-400 transition-colors">
                Architecture
              </a>
              <a href="#tech-stack" className="hover:text-blue-400 transition-colors">
                Tech Stack
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-slate-500">
            <span>&copy; {new Date().getFullYear()} TestForge. All rights reserved.</span>
            <div className="flex items-center space-x-4">
              <span>Node.js &gt;= 18</span>
              <span>Playwright 1.44</span>
              <span>Socket.IO 4.8</span>
              <span>Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
