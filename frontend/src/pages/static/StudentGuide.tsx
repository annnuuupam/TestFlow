import React from 'react';
import { CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import StaticPageLayout from './StaticPageLayout';

const StudentGuide: React.FC = () => {
  const steps = [
    { title: 'Environment Setup', desc: 'Keep your browser up-to-date. The in-browser Monaco editor is pre-configured, so you don\'t need to install anything locally.' },
    { title: 'Language Runtime', desc: 'Familiarize yourself with the libraries available on the platform. Standard libraries are included for Python, Java, and C++.'},
    { title: 'Testing Locally', desc: 'Before submitting, use the "Run Code" action to verify your logic against sample inputs and add your own edge cases.' },
    { title: 'Final Submission', desc: 'When confident, click "Submit". Our engine validates your solution against hidden test cases. Your score is final once submitted.' },
  ];

  const guides: { icon: React.ElementType; cls: string; title: string; items: string[] }[] = [
    {
      icon: CheckCircle2,
      cls: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      title: 'Best Practices',
      items: [
        'Save code frequently during long tests.',
        'Read constraints carefully to avoid TLE.',
        'Check edge cases like empty inputs.',
      ],
    },
    {
      icon: AlertCircle,
      cls: 'text-red-500 bg-red-500/10 border-red-500/20',
      title: 'Common Mistakes',
      items: [
        'Using external IDEs without refreshing.',
        'Ignoring space complexity limits.',
        'Forgetting to return results in main().',
      ],
    },
  ];

  return (
    <StaticPageLayout
      title="Student Guide"
      subtitle="Master the nuances of the TestFlow examination platform and optimize your coding workflow."
      icon={<Lightbulb className="w-8 h-8" />}
    >
      <div className="space-y-12">
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Getting Started</h2>
          <div className="space-y-5">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-all">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold">
                  {i + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-5">
          {guides.map(g => (
            <div key={g.title} className={`rounded-2xl border p-6 ${g.cls}`}>
              <h3 className={`flex items-center gap-2 font-bold mb-3 ${g.cls.split(' ')[0]}`}>
                <g.icon className="w-5 h-5" /> {g.title}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                {g.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-border bg-card p-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Mastering the IDE</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            The TestFlow editor supports syntax highlighting, auto-completion, and multi-language editing. Toggle the terminal output to see standard errors (stderr) and debug messages during execution.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
            <Lightbulb size={14} /> Tip: Press Ctrl + Space for intelligent code prompts.
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default StudentGuide;