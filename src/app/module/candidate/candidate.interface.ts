export interface ICandidateProfile {
  id: string;
  userId: string;
  phone?: string | null;
  dateOfBirth?: Date | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  resumeUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
