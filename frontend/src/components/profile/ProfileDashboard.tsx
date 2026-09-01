import React, { useEffect, useState } from 'react';
import { 
  Mail, Calendar, 
  Flame, Award, Target, BookOpen, 
  TrendingUp, Edit3, Github, Twitter, Linkedin, User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { profileApi } from '@/api/profile.api';
import { ProfileResponse, ActivityPoint } from '@/types';
import ActivityHeatmap from './ActivityHeatmap';
import BadgeGallery from './BadgeGallery';
import { useAuthStore } from '@/store/useAuthStore';
import { cn, formatRelative } from '@/utils';

import EditProfileModal from './EditProfileModal';
import RecentSubmissions from './RecentSubmissions';
import StatCard from '@/components/ui/StatCard';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

const ProfileDashboard: React.FC = () => {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { role } = useAuthStore();

  const fetchData = async () => {
    try {
      const [pData, aData] = await Promise.all([
        profileApi.getMyProfile(),
        profileApi.getActivity()
      ]);
      setProfile(pData);
      setActivity(aData);
    } catch (err) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner label="Syncing User Data..." />
      </div>
    );
  }

  if (!profile) return (
    <EmptyState
      icon={User}
      title="Identity Lost"
      description="We couldn't retrieve your profile data. Please try again."
      className="py-20"
    />
  );

  const levelRemaining = Math.max(0, 50 - (profile.totalSolved || 0))
  const levelProgress = Math.min(((profile.totalSolved || 0) / 50) * 100, 100)

  const stats = [
    { label: 'Solved', value: profile.totalSolved || 0, Icon: BookOpen, iconClass: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' },
    { label: 'Accuracy', value: `${(profile.accuracy || 0).toFixed(1)}%`, Icon: Target, iconClass: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400' },
    { label: 'Streak', value: profile.currentStreak || 0, Icon: Flame, iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { label: 'Max Streak', value: profile.maxStreak || 0, Icon: TrendingUp, iconClass: 'bg-blue-500/10 text-blue-500 dark:text-blue-400' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-20">

      {/* ── Profile Header ── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
        <div className="relative bg-card border border-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start transition-all duration-300">
          
          <div className="relative group/avatar shrink-0">
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-background shadow-xl shadow-primary/10 bg-secondary">
              <img 
                src={profile.profilePicture || `https://ui-avatars.com/api/?name=${profile.fullName}&background=6366f1&color=fff&size=256`} 
                alt={profile.fullName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
              />
            </div>
            <Button 
              variant="primary"
              size="icon"
              onClick={() => setIsEditModalOpen(true)}
              className="absolute -bottom-2 -right-2 rounded-xl shadow-lg shadow-primary/30 border-2 border-background"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-5 text-center md:text-left pt-1">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <h1 className="text-3xl font-bold text-foreground tracking-tight leading-none">{profile.fullName}</h1>
                <span className="bg-primary/10 text-primary border border-primary/25 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">{role || 'Student'}</span>
              </div>
              <p className="text-muted-foreground font-mono text-sm tracking-tight">@{profile.username}</p>
            </div>

            <p className="text-muted-foreground max-w-2xl leading-relaxed font-medium">
              {profile.bio || `Passionate enthusiast exploring the TestFlow ecosystem. Crafting high-performance digital logic and mastering competitive algorithms.`}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border text-xs font-medium text-muted-foreground"><Mail className="w-3.5 h-3.5 text-primary" /> {profile.email}</div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border text-xs font-medium text-muted-foreground"><Calendar className="w-3.5 h-3.5 text-amber-500" /> Active {formatRelative(profile.lastActiveDate)}</div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border text-xs font-medium text-muted-foreground"><TrendingUp className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> {profile.totalSubmissions ?? 0} total submissions</div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
              {(profile.skills || []).map(skill => (
                <span key={skill} className="px-3 py-1.5 bg-secondary/60 text-muted-foreground rounded-lg text-[10px] uppercase tracking-widest font-bold border border-border hover:border-primary/30 hover:text-foreground transition-all cursor-default">
                  {skill}
                </span>
              ))}
              {(profile.skills || []).length === 0 && (
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  + Add skills to showcase your expertise
                </button>
              )}
            </div>
          </div>

          <div className="flex md:flex-col gap-3">
            {[
              { Icon: Github, url: profile.githubUrl, color: 'hover:text-foreground' },
              { Icon: Twitter, url: profile.twitterUrl, color: 'hover:text-sky-500 dark:hover:text-sky-400' },
              { Icon: Linkedin, url: profile.linkedinUrl, color: 'hover:text-blue-600 dark:hover:text-blue-400' }
            ].map((social, idx) => social.url ? (
              <a 
                key={idx} 
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "p-2.5 bg-secondary/60 border border-border text-muted-foreground rounded-xl transition-all shadow-sm hover:shadow hover:-translate-y-0.5 hover:bg-secondary",
                  social.color
                )}
              >
                <social.Icon className="w-4 h-4" />
              </a>
            ) : null)}
          </div>
        </div>
      </div>

      {/* ── Level Progress ── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Level Progress</span>
          <span className="text-xs font-semibold text-primary">
            {profile.totalSolved || 0} / 50 problems
          </span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-2">
          {levelRemaining > 0
            ? `${levelRemaining} more problem${levelRemaining !== 1 ? 's' : ''} to reach Level 2`
            : 'Level 2 milestone reached! Keep the streak alive'}
        </p>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.Icon}
            iconClass={stat.iconClass}
          />
        ))}
      </div>

      {/* ── Dashboard Content area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Feed: Heatmap & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityHeatmap data={activity} />
          <RecentSubmissions />
        </div>

        {/* Sidebar: Insights & Badges */}
        <div className="space-y-6">
          <BadgeGallery badges={profile.badges || []} />
          
          <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </span>
              Performance Stats
            </h3>
            <div className="space-y-6">
               {[
                 { name: 'Coding Problems', progress: Math.min((profile.totalSolved / 50) * 100, 100), color: 'bg-emerald-500' },
                 { name: 'Accuracy Rate', progress: profile.accuracy || 0, color: 'bg-indigo-500' },
                 { name: 'Consistency', progress: Math.min((profile.currentStreak / 7) * 100, 100), color: 'bg-amber-500' },
               ].map((item, i) => (
                 <div key={i} className="space-y-2.5">
                     <div className="flex justify-between items-end">
                       <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.name}</span>
                       <span className="text-sm font-bold text-foreground">{Math.round(item.progress)}%</span>
                     </div>
                     <div className="h-2 bg-secondary rounded-full overflow-hidden">
                       <div 
                         className={cn("h-full rounded-full transition-all duration-1000 ease-out", item.color)}
                         style={{ width: `${item.progress}%` }}
                       ></div>
                     </div>
                 </div>
               ))}
            </div>
            
            <div className="mt-6 p-5 bg-primary/5 border border-primary/10 rounded-2xl">
                <h4 className="font-bold text-foreground mb-1 text-xs uppercase tracking-widest">Growth Mindset</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {levelRemaining > 0
                    ? `You're making steady progress. Solve ${levelRemaining} more problem${levelRemaining !== 1 ? 's' : ''} to reach Level 2!`
                    : `Excellent! You've crossed ${profile.totalSolved} solved problems — the Level 2 milestone is yours. Keep the streak alive!`}
                </p>
            </div>
          </div>
        </div>

      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default ProfileDashboard;
