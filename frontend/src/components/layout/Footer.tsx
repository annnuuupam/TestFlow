import React from 'react';
import { NavLink } from 'react-router-dom';
import { Github, Twitter, Linkedin, MessageSquare, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

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
    <footer className="bg-card border-t border-border pt-20 pb-10 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">

          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-foreground">
                TEST<span className="text-primary">FLOW</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Empowering the next generation of developers with a state-of-the-art coding assessment platform. Professional-grade testing made simple.
            </p>
            <div className="flex items-center gap-4">
              <Github className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
              <Twitter className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
              <Linkedin className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
              <MessageSquare className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
            </div>
          </div>

          {/* Nav Sections */}
          {sections.map((section) => (
            <div key={section.title} className="lg:col-span-1 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary">{section.title}</h4>
              <ul className="space-y-3">
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

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary">Engage</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" /> support@testflow.io
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" /> +1 (800) TEST-PRO
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" /> San Francisco, CA
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} TestFlow Global Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-50">Judge0 Integrated</span>
            <div className="h-4 w-[1px] bg-border"></div>
            <p className="text-[10px] text-muted-foreground/60 font-medium">Engineered for Performance</p>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
