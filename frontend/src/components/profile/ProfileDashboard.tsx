import React, { useEffect, useState } from 'react';
import {
  Mail, Calendar, Target, BookOpen,
  TrendingUp, Edit3, Github, Twitter, Linkedin, User,
  Award, Trophy, Check, Zap, ChevronRight
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

const LEVEL_SIZE = 50;
const MAX_SOLVED = LEVEL_SIZE * 3; // Level journey track spans L1 → L4
const MILESTONES = [
  { level: 1, target: 0 },
  { level: 2, target: LEVEL_SIZE },
  { level: 3, target: LEVEL_SIZE * 2 },
  { level: 4, target: LEVEL_SIZE * 3 },
];

const SegmentedBar: React.FC<{ value: number; color: string; segments?: number }> = ({ value, color, segments = 12 }) => {
  const filled = Math.round((Math.min(Math.max(value, 0), 100) / 100) * segments);
  return (
    <div className="flex gap-1">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 flex-1 rounded-[3px] transition-colors duration-500',
            i < filled ? color : 'bg-secondary'
          )}
        />
      ))}
    </div>
  );
};

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

  const solved = profile.totalSolved || 0;
  const level = Math.floor(solved / LEVEL_SIZE) + 1;
  const nextTarget = level * LEVEL_SIZE;
  const levelRemaining = Math.max(0, nextTarget - solved);
  const inLevel = solved % LEVEL_SIZE;
  const trackPct = Math.min((solved / MAX_SOLVED) * 100, 100);

  const nameParts = profile.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || profile.username;
  const lastName = nameParts.slice(1).join(' ');

  const stats = [
    { label: 'Problems Solved', value: solved, Icon: BookOpen, iconClass: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400', hint: solved >= 50 ? 'Level 2 unlocked' : 'of the 50 problem milestone' },
    { label: 'Accuracy', value: `${(profile.accuracy || 0).toFixed(1)}%`, Icon: Target, iconClass: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400', hint: 'correct submissions' },
    { label: 'Streak', value: profile.currentStreak || 0, Icon: Zap, iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', hint: 'current days in a row' },
    { label: 'Best Streak', value: profile.maxStreak || 0, Icon: TrendingUp, iconClass: 'bg-blue-500/10 text-blue-500 dark:text-blue-400', hint: 'personal record' },
  ];

  const performance = [
    { name: 'Coding Problems', value: Math.min((solved / LEVEL_SIZE) * 100, 100), color: 'bg-emerald-500' },
    { name: 'Accuracy Rate', value: profile.accuracy || 0, color: 'bg-indigo-500' },
    { name: 'Consistency', value: Math.min((profile.currentStreak / 7) * 100, 100), color: 'bg-amber-500' },
  ];

  const socials = [
    { Icon: Github, url: profile.githubUrl, hover: 'hover:text-foreground hover:border-foreground/30' },
    { Icon: Twitter, url: profile.twitterUrl, hover: 'hover:text-sky-500 hover:border-sky-500/40' },
    { Icon: Linkedin, url: profile.linkedinUrl, hover: 'hover:text-blue-600 hover:border-blue-600/40' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-20">

      {/* ══ Profile Hero ══ */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute -top-28 -right-28 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="relative p-5 sm:p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="p-1.5 rounded-[26px] bg-gradient-to-tr from-primary to-accent shadow-xl shadow-primary/25">
                <div className="rounded-[20px] overflow-hidden bg-secondary">
                  <img
                    src={profile.profilePicture || `https://ui-avatars.com/api/?name=${profile.fullName}&background=6366f1&color=fff&size=256`}
                    alt={profile.fullName}
                    className="w-28 h-28 sm:w-36 sm:h-36 object-cover"
                  />
                </div>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                <span className="relative flex w-3 h-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              </div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                title="Edit profile"
                className="absolute -top-2 -right-2 w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent text-white border-[3px] border-card shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-110 hover:shadow-primary/60 transition-all active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Identity */}
            <div className="flex-1 space-y-4 text-center lg:text-left pt-2 lg:pt-0">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-none">
                    {firstName} {lastName && <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{lastName}</span>}
                  </h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-white text-[10px] font-black uppercase tracking-widest shadow-sm shadow-primary/30">
                    {role || 'Student'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[11px] font-bold uppercase tracking-wider">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    Active
                  </span>
                </div>
                <p className="font-mono text-sm text-muted-foreground tracking-tight">@{profile.username}</p>
              </div>

              <p className="text-muted-foreground max-w-2xl leading-relaxed font-medium mx-auto lg:mx-0">
                {profile.bio || `Passionate enthusiast exploring the TestFlow ecosystem. Crafting high-performance digital logic and mastering competitive algorithms.`}
              </p>

              {/* Meta chips */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 border border-border text-xs font-medium text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 text-primary" /> {profile.email}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 border border-border text-xs font-medium text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> Active {formatRelative(profile.lastActiveDate)}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 border border-border text-xs font-medium text-muted-foreground">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> {profile.totalSubmissions ?? 0} total submissions
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                {(profile.skills || []).map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-secondary/60 text-muted-foreground rounded-lg text-[10px] uppercase tracking-widest font-bold border border-border hover:border-primary/40 hover:text-foreground hover:-translate-y-0.5 transition-all cursor-default"
                  >
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

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2 justify-center lg:justify-start">
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  className="gap-2 bg-gradient-to-r from-primary to-accent border-0 shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5"
                >
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </Button>
                {socials.map(({ Icon, url, hover }, idx) => url ? (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'p-2.5 bg-secondary/60 border border-border text-muted-foreground rounded-xl transition-all shadow-sm hover:shadow hover:-translate-y-0.5 hover:bg-secondary',
                      hover
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ) : null)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Level Journey ══ */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-6 sm:p-8">
        <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-primary/[0.06] rounded-full blur-3xl" />

        <div className="relative grid lg:grid-cols-[auto_1fr] gap-8 items-center">
          <div className="flex items-center gap-5 shrink-0 justify-center lg:justify-start">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 relative">
              <Trophy className="w-8 h-8 text-white" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-card border border-border flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              </span>
            </div>
            <div className="text-center lg:text-left">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-1">Level Journey</p>
              <p className="text-4xl font-black leading-none">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Level {level}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 font-mono">{solved} problems solved</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Milestone labels */}
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
              {MILESTONES.map(m => (
                <span key={m.level} className={cn('flex flex-col items-center gap-0.5', solved >= m.target ? 'text-primary' : 'text-muted-foreground/50')}>
                  <span>Level {m.level}</span>
                  <span className="font-mono normal-case tracking-normal text-[9px] opacity-80">{m.target}</span>
                </span>
              ))}
            </div>

            {/* Track + milestone markers */}
            <div className="relative">
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${trackPct}%` }}
                >
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/70 blur-[1px] shadow-[0_0_10px_2px_rgba(255,255,255,0.7)]" />
                </div>
              </div>
              <div className="absolute inset-x-0 top-0 h-full pointer-events-none">
                {MILESTONES.map(m => (
                  <div key={m.level} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${(m.target / MAX_SOLVED) * 100}%` }}>
                    <div className={cn(
                      'w-5 h-5 -translate-x-1/2 rounded-full border-2 flex items-center justify-center transition-colors duration-500',
                      solved >= m.target
                        ? 'bg-gradient-to-tr from-primary to-accent border-card shadow-md shadow-primary/40'
                        : 'bg-secondary border-border'
                    )}>
                      {solved >= m.target && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {levelRemaining > 0 ? (
                  <>
                    <b className="text-foreground font-bold">{levelRemaining}</b> more problem{levelRemaining !== 1 ? 's' : ''} to reach{' '}
                    <span className="font-semibold text-primary">Level {level + 1}</span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Check className="w-4 h-4" /> Level milestone reached — next stop: <span className="text-primary">Level {level + 1}</span>
                  </span>
                )}
              </p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/70 border border-border text-[10px] font-mono text-muted-foreground">
                {inLevel}/50 in current level
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Stats Grid ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.Icon}
            iconClass={stat.iconClass}
            hint={stat.hint}
          />
        ))}
      </div>

      {/* ══ Content ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main feed */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityHeatmap data={activity} />
          <RecentSubmissions />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 animate-fade-in">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </span>
              Performance Stats
            </h3>

            <div className="space-y-6">
              {performance.map((item, i) => (
                <div key={i} className="space-y-2.5">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.name}</span>
                    <span className="text-sm font-bold text-foreground">{Math.round(item.value)}%</span>
                  </div>
                  <SegmentedBar value={item.value} color={item.color} />
                </div>
              ))}
            </div>

            <div className="mt-6 p-5 bg-gradient-to-br from-primary/[0.07] to-accent/[0.06] border border-primary/10 rounded-2xl relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
              <h4 className="font-bold text-foreground mb-1 text-xs uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Growth Mindset
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed relative">
                {levelRemaining > 0
                  ? `You're making steady progress. Solve ${levelRemaining} more problem${levelRemaining !== 1 ? 's' : ''} to reach Level ${level + 1}!`
                  : `Excellent! You've crossed level ${level} — the milestone is yours. Keep the streak alive and chase Level ${level + 1}!`}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                Keep grinding <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          <BadgeGallery badges={profile.badges || []} />
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