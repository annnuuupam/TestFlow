import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, User, FileText, Tag, Loader2 } from 'lucide-react';
import { ProfileResponse } from '@/types';
import { profileApi } from '@/api/profile.api';
import { toast } from 'react-hot-toast';
import { cn } from '@/utils';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(200, 'Bio must be under 200 characters').optional(),
  skills: z.string().transform(val => val.split(',').map(s => s.trim()).filter(s => s !== '')),
  githubUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  linkedinUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  twitterUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileResponse;
  onSuccess: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, profile, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.fullName || '',
      bio: profile.bio || '',
      skills: (profile.skills || []).join(', '),
      githubUrl: profile.githubUrl || '',
      linkedinUrl: profile.linkedinUrl || '',
      twitterUrl: profile.twitterUrl || '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: any) => {
    try {
      await profileApi.updateProfile(data);
      toast.success('Profile updated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
          <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Edit Profile
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-foreground/10 rounded-xl transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</label>
            <input 
              {...register('fullName')}
              className={cn(
                "w-full bg-secondary/50 border border-border focus:border-primary/50 rounded-xl px-4 py-2.5 outline-none transition-all duration-300",
                errors.fullName && "border-red-500/50"
              )}
            />
            {errors.fullName && <p className="text-[9px] font-bold text-red-500 uppercase">{errors.fullName.message as string}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Professional Bio</label>
            <textarea 
              {...register('bio')}
              rows={2}
              className={cn(
                "w-full bg-secondary/50 border border-border focus:border-primary/50 rounded-xl px-4 py-2.5 outline-none transition-all duration-300 resize-none",
                errors.bio && "border-red-500/50"
              )}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Skills (comma separated)</label>
            <input 
              {...register('skills')}
              className="w-full bg-secondary/50 border border-border focus:border-primary/50 rounded-xl px-4 py-2.5 outline-none transition-all duration-300"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">GitHub URL</label>
              <input 
                {...register('githubUrl')}
                placeholder="https://github.com/..."
                className="w-full bg-secondary/50 border border-border focus:border-primary/50 rounded-xl px-4 py-2.5 outline-none transition-all duration-300 text-sm"
              />
              {errors.githubUrl && <p className="text-[9px] font-bold text-red-500 uppercase">{errors.githubUrl.message as string}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">LinkedIn URL</label>
              <input 
                {...register('linkedinUrl')}
                placeholder="https://linkedin.com/in/..."
                className="w-full bg-secondary/50 border border-border focus:border-primary/50 rounded-xl px-4 py-2.5 outline-none transition-all duration-300 text-sm"
              />
              {errors.linkedinUrl && <p className="text-[9px] font-bold text-red-500 uppercase">{errors.linkedinUrl.message as string}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Twitter URL</label>
              <input 
                {...register('twitterUrl')}
                placeholder="https://twitter.com/..."
                className="w-full bg-secondary/50 border border-border focus:border-primary/50 rounded-xl px-4 py-2.5 outline-none transition-all duration-300 text-sm"
              />
              {errors.twitterUrl && <p className="text-[9px] font-bold text-red-500 uppercase">{errors.twitterUrl.message as string}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 sticky bottom-0 bg-card py-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-2xl border border-border transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
