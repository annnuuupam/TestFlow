import React, { useEffect, useState } from 'react';
import { 
  Mail, MapPin, Calendar, 
  Flame, Award, Target, BookOpen, 
  TrendingUp, Edit3, Github, Twitter, Linkedin, User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { profileApi } from '@/api/profile.api';
import { ProfileResponse, ActivityPoint } from '@/types';
import ActivityHeatmap from './ActivityHeatmap';
import BadgeGallery from './BadgeGallery';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/utils';

import EditProfileModal from './EditProfileModal';
import RecentSubmissions from './RecentSubmissions';

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary shadow-lg shadow-primary/20"></div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing User Data...</p>
      </div>
    );
  }

  if (!profile) return (
    <div className="text-center py-20 grayscale opacity-50 space-y-6">
       <div className="w-24 h-24 bg-secondary rounded-[2rem] flex items-center justify-center mx-auto border border-border shadow-2xl">
         <User size={48} className="text-muted-foreground" />
       </div>
       <div className="space-y-1">
         <p className="text-xl font-black text-foreground uppercase tracking-tight">Identity Lost</p>
         <p className="text-sm text-muted-foreground">We couldn't retrieve your profile data. Please try again.</p>
       </div>
    </div>
  );

  const stats = [
    { label: 'Solved', value: profile.totalSolved || 0, icon: <BookOpen className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-400/10', glow: 'shadow-emerald-500/10' },
    { label: 'Accuracy', value: `${(profile.accuracy || 0).toFixed(1)}%`, icon: <Target className="w-5 h-5" />, color: 'text-indigo-400', bg: 'bg-indigo-400/10', glow: 'shadow-indigo-500/10' },
    { label: 'Streak', value: profile.currentStreak || 0, icon: <Flame className="w-5 h-5" />, color: 'text-orange-400', bg: 'bg-orange-400/10', glow: 'shadow-orange-500/10' },
    { label: 'Max Streak', value: profile.maxStreak || 0, icon: <TrendingUp className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-400/10', glow: 'shadow-blue-500/10' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* ── Profile Header ── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
        <div className="relative bg-card border border-border rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center md:items-start shadow-2xl shadow-black/5 transition-all duration-300">
          
          <div className="relative group/avatar">
            <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-background shadow-2xl relative z-10 bg-secondary">
              <img 
                src={profile.profilePicture || `https://ui-avatars.com/api/?name=${profile.fullName}&background=6366f1&color=fff&size=256`} 
                alt={profile.fullName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
              />
            </div>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="absolute -bottom-2 -right-2 p-3 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20 transition-all hover:rotate-12 z-20 group-hover/avatar:scale-110 border-2 border-background"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 space-y-6 text-center md:text-left pt-2">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <h1 className="text-4xl font-black text-foreground tracking-tight leading-none">{profile.fullName}</h1>
                <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{role || 'Student'}</span>
              </div>
              <p className="text-muted-foreground font-mono text-sm tracking-tight">@{profile.username}</p>
            </div>

            <p className="text-muted-foreground max-w-2xl leading-relaxed font-medium">
              {profile.bio || `Passionate enthusiast exploring the TestFlow ecosystem. Crafting high-performance digital logic and mastering competitive algorithms.`}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/80 hover:text-foreground transition-colors"><Mail className="w-4 h-4 text-primary" /> {profile.email}</div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/80 hover:text-foreground transition-colors"><MapPin className="w-4 h-4 text-emerald-400" /> Platform Global</div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/80 hover:text-foreground transition-colors"><Calendar className="w-4 h-4 text-amber-400" /> Member since 2024</div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              {(profile.skills || []).map(skill => (
                <span key={skill} className="px-4 py-1.5 bg-foreground/[0.03] text-foreground/70 rounded-xl text-[10px] uppercase tracking-widest font-black border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-default">
                  {skill}
                </span>
              ))}
              {(profile.skills || []).length === 0 && (
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  + Add skills to showcase your expertise
                </button>
              )}
            </div>
          </div>

          <div className="flex md:flex-col gap-3 py-2">
            {[
              { Icon: Github, url: profile.githubUrl, color: 'hover:text-primary' },
              { Icon: Twitter, url: profile.twitterUrl, color: 'hover:text-sky-400' },
              { Icon: Linkedin, url: profile.linkedinUrl, color: 'hover:text-blue-600' }
            ].map((social, idx) => social.url ? (
              <a 
                key={idx} 
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "p-3 bg-secondary/50 border border-border text-muted-foreground rounded-2xl transition-all shadow-sm hover:shadow-primary/5 hover:-translate-y-1 hover:bg-secondary flex items-center justify-center",
                  social.color
                )}
              >
                <social.Icon className="w-5 h-5" />
              </a>
            ) : null)}
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className={cn("bg-card border border-border p-8 rounded-[2rem] relative overflow-hidden group shadow-xl shadow-black/5 hover:-translate-y-1 transition-all duration-300", stat.glow)}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} blur-[60px] opacity-40 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="relative space-y-4">
              <div className={cn("inline-flex p-4 rounded-2xl border border-transparent transition-all", stat.bg, stat.color)}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">{stat.label}</p>
                <p className="text-3xl font-black text-foreground tracking-tighter mt-1">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Dashboard Content area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Feed: Heatmap & Recent Activity */}
        <div className="lg:col-span-2 space-y-10">
          <ActivityHeatmap data={activity} />
          <RecentSubmissions />
        </div>

        {/* Sidebar: Insights & Badges */}
        <div className="space-y-10">
          <BadgeGallery badges={profile.badges || []} />
          
          <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl shadow-black/5">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-8 flex items-center gap-2">
              <Award className="w-4 h-4" /> Performance Stats
            </h3>
            <div className="space-y-8">
               {[
                 { name: 'Coding Problems', progress: Math.min((profile.totalSolved / 50) * 100, 100), color: 'bg-emerald-500' },
                 { name: 'Accuracy Rate', progress: profile.accuracy || 0, color: 'bg-indigo-500' },
                 { name: 'Consistency', progress: Math.min((profile.currentStreak / 7) * 100, 100), color: 'bg-amber-500' },
               ].map((item, i) => (
                 <div key={i} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{item.name}</span>
                      <span className="text-sm font-black text-foreground">{Math.round(item.progress)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border/50">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-1000 ease-out", item.color)}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                 </div>
               ))}
            </div>
            
            <div className="mt-10 p-5 bg-primary/5 border border-primary/10 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
                <h4 className="font-black text-foreground mb-1 text-xs uppercase tracking-widest">Growth Mindset</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  You're making steady progress. Solve 5 more problems to reach Level 2!
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
