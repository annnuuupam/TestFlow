import React from 'react';
import { HelpCircle, ChevronRight } from 'lucide-react';
import StaticPageLayout from './StaticPageLayout';

const HelpCenter: React.FC = () => {
  const faqs = [
    { q: 'How do I start a test?', a: 'Navigate to the "Exams" page, select your assigned test, and click the "Start Attempt" button. Ensure you have a stable connection.' },
    { q: 'What programming languages are supported?', a: 'TestFlow currently supports over 50 languages, including Python, Java, C++, TypeScript, and Go, powered by the Judge0 execution engine.' },
    { q: 'Can I resume a test if I get disconnected?', a: 'Yes, our platform automatically saves your progress. You can resume from where you left off as long as the timer has not expired.' },
    { q: 'Where can I see my performance?', a: 'Visit your "Profile" or the "Results" section to see a detailed breakdown of your solved problems, accuracy, and consistency streaks.' },
  ];

  return (
    <StaticPageLayout 
      title="Help Center" 
      subtitle="Find answers to common questions and learn how to get the most out of the TestFlow platform."
      icon={<HelpCircle className="w-8 h-8" />}
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
          <div className="grid gap-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-6 bg-secondary/30 rounded-2xl border border-border hover:border-primary/30 transition-all group">
                <h3 className="font-bold text-lg text-foreground mb-2 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                  {faq.q}
                </h3>
                <p className="text-muted-foreground leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="p-8 bg-primary/5 rounded-3xl border border-primary/10">
          <h2 className="text-xl font-bold text-foreground mb-4">Need immediate technical assistance?</h2>
          <p className="text-muted-foreground mb-6">Our support engineers are available 24/7 to help you with environment issues, compiler errors, or account recovery.</p>
          <div className="flex flex-wrap gap-4">
            <div className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold">Email: support@testflow.io</div>
            <div className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold">Priority Support: +1 (800) TEST-PRO</div>
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default HelpCenter;
