import React from 'react';
import { ShieldCheck, Lock, Eye, Database } from 'lucide-react';
import StaticPageLayout from './StaticPageLayout';

const PrivacyPolicy: React.FC = () => {
  const points = [
    { icon: <Database className="w-5 h-5 text-primary" />, title: 'Personal Information', desc: 'At TestFlow, we prioritize your data security and only collect information necessary to provide our coding assessment services, including your name, email, and academic/professional background.' },
    { icon: <Lock className="w-5 h-5 text-emerald-400" />, title: 'Secure Infrastructure', desc: 'Your code submissions and performance metrics are encrypted at rest and in transit using industry-standard TLS 1.3 and AES-256 protocols.' },
    { icon: <Eye className="w-5 h-5 text-indigo-400" />, title: 'Transparency Control', desc: 'We never share your personal data with third parties for marketing. Your performance results are only visible to authorized administrators and recruiters managing your assessments.' },
  ];

  return (
    <StaticPageLayout 
      title="Privacy Policy" 
      subtitle="Your privacy is the core of our platform's integrity. Learn how we protect and manage your professional data."
      icon={<ShieldCheck className="w-8 h-8" />}
    >
      <div className="space-y-12">
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Data Privacy Commitments</h2>
          <div className="grid gap-8">
            {points.map((point, i) => (
              <div key={i} className="flex gap-6 p-6 bg-secondary/20 rounded-3xl border border-border">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center shadow-lg">
                  {point.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-foreground">{point.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {point.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">1. User Account Data</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            TestFlow collects account identifiers such as username and email to manage your profile and synchronize competitive streaks. This data is stored on high-availability, compliant cloud servers and is never accessed without explicit administrative authorization.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">2. Code Execution Security</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            All code submissions are executed in isolated, secure Docker containers (Judge0 Engine). This ensures that your system resources and our platform integrity are protected. No user-specific data from these containers is retained after the execution lifecycle.
          </p>
        </section>

        <section className="p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
          <h2 className="text-lg font-bold text-foreground mb-2 italic">Policy Updates & Compliance</h2>
          <p className="text-sm text-muted-foreground">This policy is updated periodically to ensure compliance with global data protection standards (GDPR, CCPA). Continued use of the platform after updates constitutes acceptance of these terms.</p>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default PrivacyPolicy;
