import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Loader2 } from 'lucide-react';
import { ProfileResponse } from '@/types';
import { profileApi } from '@/api/profile.api';
import { toast } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';

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
  const updateFullName = useAuthStore(s => s.updateFullName);
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

  const onSubmit = async (data: any) => {
    try {
      await profileApi.updateProfile(data);
      updateFullName(data.fullName);
      toast.success('Profile updated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </span>
          Edit Profile
        </span>
      }
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-profile-form" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </>
      }
    >
      <form id="edit-profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Full Name"
          placeholder="Your name"
          error={errors.fullName?.message as string}
          {...register('fullName')}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Professional Bio</label>
          <textarea
            {...register('bio')}
            rows={2}
            placeholder="A short bio about yourself"
            className="input resize-none"
          />
          {errors.bio && <p className="text-xs font-medium text-red-500">{errors.bio.message as string}</p>}
        </div>

        <Input
          label="Skills (comma separated)"
          placeholder="Java, React, Algorithms"
          error={errors.skills?.message as string}
          {...register('skills')}
        />

        <div className="grid grid-cols-1 gap-4 pt-2">
          <Input
            label="GitHub URL"
            placeholder="https://github.com/..."
            error={errors.githubUrl?.message as string}
            {...register('githubUrl')}
          />

          <Input
            label="LinkedIn URL"
            placeholder="https://linkedin.com/in/..."
            error={errors.linkedinUrl?.message as string}
            {...register('linkedinUrl')}
          />

          <Input
            label="Twitter URL"
            placeholder="https://twitter.com/..."
            error={errors.twitterUrl?.message as string}
            {...register('twitterUrl')}
          />
        </div>
      </form>
    </Modal>
  );
};

export default EditProfileModal;