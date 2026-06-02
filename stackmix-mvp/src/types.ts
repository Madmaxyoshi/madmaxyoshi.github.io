export interface Project {
  id: string;
  title: string;
  owner_id: string;
  collaborators: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Track {
  id: string;
  project_id: string;
  title: string;
  file_url: string;
  duration_seconds: number;
  version: number;
  stem_type: 'full' | 'drums' | 'bass' | 'vocals' | 'guitar' | 'keys' | 'other';
  uploaded_by: string;
  created_at: Date;
}

export interface Comment {
  id: string;
  track_id: string;
  author_id: string;
  timestamp_seconds: number;
  text: string;
  resolved: boolean;
  created_at: Date;
}

export interface ReviewRequest {
  id: string;
  project_id: string;
  track_id: string;
  requester_id: string;
  reviewer_id: string;
  status: 'pending' | 'approved' | 'revision_requested';
  note?: string;
  created_at: Date;
  responded_at?: Date;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
