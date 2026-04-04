import React from 'react';
import { FileText, CheckCircle, Scale, AlertTriangle } from 'lucide-react';
import StaticPageLayout from './StaticPageLayout';

const Terms: React.FC = () => {
  const sections = [
    { 
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />, 
      title: 'Usage License', 
      desc: 'TestFlow grants you a revocable, non-exclusive license to access the platform for the sole purpose of undergoing assessments and coding practice. Re-selling, scraping, or modifying the platform code strictly prohibited.' 
    },
    { 
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, 
      title: 'Academic Integrity', 
      desc: 'All solutions must be authored by you. Use of external AI tools, unauthorized collaboration, or plagiarism will result in immediate disqualification and account termination.' 
    },
    { 
      icon: <Scale className="w-5 h-5 text-indigo-400" />, 
      title: 'Liability Limitation', 
      desc: 'TestFlow provides services "as is." We are not liable for any indirect or consequential damages arising from service interruptions or connectivity issues during examinations.' 
    },
  ];

  return (
    <StaticPageLayout 
      title="Terms & Conditions" 
      subtitle="The governance framework for the TestFlow platform. By accessing our services, you agree to these professional-grade standards."
      icon={<FileText className="w-8 h-8" />}
    >
      <div className="space-y-12">
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Platform Governance</h2>
          <div className="grid gap-8 border-b border-border pb-12">
            {sections.map((section, i) => (
              <div key={i} className="flex gap-6 p-6 bg-secondary/10 rounded-3xl border border-border">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center shadow-lg">
                  {section.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-foreground">{section.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {section.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground underline decoration-primary/30 underline-offset-8">1. Account Security</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You are responsible for maintaining the confidentiality of your login credentials. Sharing accounts is strictly forbidden and may trigger an automated security lock. TestFlow reserves the right to suspend accounts that exhibit suspicious login patterns or API abuse.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground underline decoration-primary/30 underline-offset-8">2. Intellectual Property</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            All code challenges, test cases, and platform assets are the exclusive intellectual property of TestFlow Global Inc. You may not reproduce, distribute, or publicly display any of the challenge content without express written permission.
          </p>
        </section>

        <div className="p-8 bg-card border border-border rounded-3xl shadow-xl shadow-black/5 text-center">
          <h3 className="text-sm font-black uppercase text-primary mb-2">Notice of Acceptance</h3>
          <p className="text-xs text-muted-foreground">These terms are effective as of April 2026. Continued use of TestFlow constitutes your legally binding agreement to these platform standards.</p>
        </div>
      </div>
    </StaticPageLayout>
  );
};

export default Terms;
