import React from 'react';
import { Link } from 'react-router-dom';
import {
  Code2, BarChart3, Users, ArrowRight, CheckCircle2,
  Timer, FileEdit, Award, Lock, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';

const features = [
  { icon: Code2, title: 'Coding Challenges', desc: 'Solve problems in Java, Python, C++ and more with a full in-browser IDE and Judge0-powered execution.' },
  { icon: Timer, title: 'Timed Examinations', desc: 'Configure durations, negative marking, passing criteria and multiple attempts per paper.' },
  { icon: FileEdit, title: 'Flexible Questions', desc: 'Multiple choice, multi-select and coding questions with per-question marking controls.' },
  { icon: BarChart3, title: 'Performance Analytics', desc: 'Track streaks, accuracy and submission trends with a personal activity heatmap.' },
  { icon: Users, title: 'Leaderboards & Ranking', desc: 'Compare against peers with global and per-exam rankings in near real-time.' },
  { icon: Lock, title: 'Secure by Design', desc: 'Role-based access, hidden test cases and isolated code execution to protect integrity.' },
];

const steps = [
  { n: '01', title: 'Explore', desc: 'Browse coding problems and available examinations tailored to your track.' },
  { n: '02', title: 'Practice & Sit Exams', desc: 'Attempt timed tests, run code with custom inputs and refine your approach.' },
  { n: '03', title: 'Track Growth', desc: 'Review detailed reports, earn badges and climb the leaderboard.' },
];

export default function Landing() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute top-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6 animate-fade-in">
            <Sparkles size={13} />
            Modern examination platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.05] animate-fade-in">
            Assess skills with
            <br />
            <span className="gradient-text">confidence and clarity.</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in">
            TestFlow pairs timed examinations with a professional coding environment — so students get real feedback and admins get trustworthy signals.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
            {isAuthenticated ? (
              <Button size="lg" onClick={() => window.location.href = '/'} className="min-w-44">
                Go to Dashboard <ArrowRight size={16} />
              </Button>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="min-w-44">Get started free <ArrowRight size={16} /></Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="min-w-44">Sign in</Button>
                </Link>
              </>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground animate-fade-in">
            {['Free for students', 'No credit card required', '5 languages supported'].map(t => (
              <span key={t} className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: '5', label: 'Coding languages' },
            { value: '∞', label: 'Attempt & category control' },
            { value: '100%', label: 'Report transparency' },
            { value: '24/7', label: 'Platform availability' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-3xl font-extrabold gradient-text">{s.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Everything you need to run assessments</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            A complete toolkit for students and administrators — from first question to final report.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 hover-lift">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <f.icon size={20} />
              </div>
              <h3 className="font-bold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">How it works</h2>
          <p className="text-muted-foreground mt-3">Three steps between you and measurable progress.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(s => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-card p-8">
              <span className="text-5xl font-extrabold gradient-text opacity-25">{s.n}</span>
              <h3 className="font-bold text-foreground mt-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-10 sm:p-16 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-[90px]" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent/10 rounded-full blur-[90px]" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-5">
              <Award size={22} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Ready to test your potential?
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Join a platform built for serious learners and precise evaluators. Start your first assessment in seconds.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register">
                <Button size="lg" className="min-w-48">Create your account <ArrowRight size={16} /></Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="min-w-48">Sign in instead</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}