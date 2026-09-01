import React from 'react';
import { NavLink } from 'react-router-dom';
import { Github, Twitter, Linkedin, ShieldCheck, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      title: 'Platform',
      links: [
        { label: 'Coding Problems', to: '/student/problems' },
        { label: 'Exams & Tests', to: '/student/tests' },
        { label: 'Leaderboard', to: '/student/leaderboard/all' },
        { label: 'Results', to: '/student/results' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', to: '/help' },
        { label: 'Student Guide', to: '/guide' },
        { label: 'Privacy Policy', to: '/privacy' },
        { label: 'Terms & Conditions', to: '/terms' },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-12">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-foreground">
                TEST<span className="text-primary">FLOW</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Empowering the next generation of developers with a modern coding assessment platform. Professional-grade tests, made simple.
            </p>
            <div className="flex items-center gap-2">
              {[
                { href: 'https://github.com', Icon: Github, label: 'GitHub' },
                { href: 'https://x.com', Icon: Twitter, label: 'Twitter / X' },
                { href: 'https://linkedin.com', Icon: Linkedin, label: 'LinkedIn' },
              ].map(({ href, Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all" aria-label={label}>
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title} className="lg:col-span-1 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <NavLink to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail size={15} className="text-primary" /> support@testflow.io
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <MapPin size={15} className="text-primary" /> San Francisco, CA
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-7 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© {currentYear} TestFlow Inc. All rights reserved.</p>
          <p className="text-[11px] font-medium text-muted-foreground/70">Engineered for performance · Judge0 integrated</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;