import React from 'react';
import { BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import StaticPageLayout from './StaticPageLayout';

const StudentGuide: React.FC = () => {
  const steps = [
    { title: 'Environment Setup', desc: 'Ensure your browser is up-to-date and your IDE (if used locally) matches the version for your language. Our in-browser Monaco Editor is pre-configured and ready to use.' },
    { title: 'Language Runtime', desc: 'Familiarize yourself with the libraries and dependencies available on our platform. All standard libraries are included for Python, Java, and C++.' },
    { title: 'Testing Locally', desc: 'Before submitting, use our "Run Code" feature to verify your logic against sample test cases. You can also add your own custom test cases for edge cases.' },
    { title: 'Final Submission', desc: 'When you are confident, click "Submit". Our engine will validate your solution against hidden test cases. Once submitted, your score is final.' },
  ];

  return (
    <StaticPageLayout 
      title="Student Guide" 
      subtitle="Master the nuances of the TestFlow examination platform and learn how to optimize your coding workflow."
      icon={<BookOpen className="w-8 h-8" />}
    >
      <div className="space-y-12">
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Getting Started</h2>
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shadow-lg shadow-primary/5 border border-primary/20">
                  {i + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20">
            <h3 className="flex items-center gap-2 font-bold text-emerald-400 mb-3">
              <CheckCircle2 className="w-5 h-5" /> Best Practices
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>Save code frequently during long tests.</li>
              <li>Read constraints carefully to avoid TLE.</li>
              <li>Check edge cases like empty inputs.</li>
            </ul>
          </div>
          <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/20">
             <h3 className="flex items-center gap-2 font-bold text-red-400 mb-3">
              <AlertCircle className="w-5 h-5" /> Common Mistakes
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>Using external IDEs without refreshing.</li>
              <li>Ignoring space complexity limits.</li>
              <li>Forgeting to return results in main().</li>
            </ul>
          </div>
        </div>

        <section className="p-8 bg-card border border-border shadow-2xl rounded-3xl">
          <h2 className="text-lg font-bold text-foreground mb-4">Mastering the IDE</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
             The TestFlow editor supports professional-grade features like syntax highlighting, auto-completion, and multi-language support. You can toggle terminal output to see standard errors (stderr) and debug messages during execution. 
          </p>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-primary">
            Tip: Press Ctrl + Space for intelligent code prompts.
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default StudentGuide;
