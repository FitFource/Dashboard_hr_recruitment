export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'recruiter' | 'viewer';
  created_at: string;
}

export interface Candidate {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  job_role: string;
  status: 'in_progress' | 'accepted' | 'rejected';
  score?: number;
  resume_url?: string;
  linkedin_url?: string;
  years_of_experience?: number;
  skills?: string[];
  education?: string;
  location?: string;
  applied_date: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateHistory {
  id: number;
  candidate_id: number;
  action: string;
  description?: string;
  performed_by?: number;
  performed_by_name?: string;
  previous_status?: string;
  new_status?: string;
  created_at: string;
}

export interface CandidateDocument {
  id: number;
  candidate_id: number;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  uploaded_at: string;
}

export interface InterviewQuestion {
  id: number;
  job_role: string;
  question: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  expected_answer?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface JobRequirement {
  id: number;
  job_role: string;
  requirement_type: string;
  description: string;
  is_mandatory: boolean;
  minimum_years_experience?: number;
  required_skills?: string[];
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface MetricsOverview {
  total_candidates: number;
  accepted_candidates: number;
  rejected_candidates: number;
  in_progress_candidates: number;
}

export interface TopCandidate {
  id: number;
  full_name: string;
  email: string;
  job_role: string;
  status: string;
  score?: number;
  actions_count: number;
  last_action_date: string;
}

export interface CandidatesByRole {
  job_role: string;
  total_candidates: number;
  accepted: number;
  rejected: number;
  in_progress: number;
}
