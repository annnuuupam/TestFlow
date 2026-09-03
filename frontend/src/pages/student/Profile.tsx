import React from 'react';
import ProfileDashboard from '@/components/profile/ProfileDashboard';

const StudentProfile: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your coding journey, achievements, and activity</p>
      </div>
      <ProfileDashboard />
    </div>
  );
};

export default StudentProfile;