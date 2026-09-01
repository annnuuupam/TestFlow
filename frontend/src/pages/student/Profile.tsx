import React from 'react';
import ProfileDashboard from '@/components/profile/ProfileDashboard';

const StudentProfile: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-border p-6 md:p-8">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-accent/5 blur-3xl" />
        <div className="relative">
          <h1 className="page-title">Your Profile</h1>
          <p className="page-subtitle mt-1">Track your progress, badges, and coding journey</p>
        </div>
      </div>
      <ProfileDashboard />
    </div>
  );
};

export default StudentProfile;
