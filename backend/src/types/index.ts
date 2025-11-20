export interface User {
  id: number;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'recruiter' | 'viewer';
  created_at: Date;
  updated_at: Date;
}

// export interface Candidate {
//   id: number;
//   full_name: string;
//   email: string;
//   phone?: string;
//   job_role: string;
//   status: 'in_progress' | 'accepted' | 'rejected';
//   score?: number;
//   resume_url?: string;
//   linkedin_url?: string;
//   years_of_experience?: number;
//   skills?: string[];
//   education?: string;
//   location?: string;
//   applied_date: Date;
//   created_at: Date;
//   updated_at: Date;
// }

export interface Candidate {
  id: number;
  Name: string;
  Position: string;
  Email: string;
  Phone?: number;
  BirthDate?: string;
  Residence?: string;
  Gender?: string;
  Summary_Profile?: string;
  Education?: string;
  Working_exp?: string;
  Organization_exp?: string;
  Portfolio?: string;
  Hard_skill?: string;
  Soft_skill?: string;
  AI_reason?: string;
  CV_link?: string;
  Status?: string;
  Source?: string;
  CreatedDate: string;
  UpdateDate: string;
}


export interface CandidateHistory {
  id: number;
  candidate_id: number;
  action: string;
  description?: string;
  performed_by?: number;
  previous_status?: string;
  new_status?: string;
  created_at: Date;
}

// export interface InterviewQuestion {
//   id: number;
//   job_role: string;
//   question: string;
//   category?: string;
//   difficulty?: 'easy' | 'medium' | 'hard';
//   expected_answer?: string;
//   created_by?: number;
//   created_at: Date;
//   updated_at: Date;
// }
export interface InterviewQuestion {
  id: number;
  question: string;
  category?: string;
  created_at: string;
}


// export interface JobRequirement {
//   id: number;
//   job_role: string;
//   requirement_type: string;
//   description: string;
//   is_mandatory: boolean;
//   minimum_years_experience?: number;
//   required_skills?: string[];
//   created_by?: number;
//   created_at: Date;
//   updated_at: Date;
// }
export interface JobRequirement {
  id: number;
  Role: string;
  RequirementList: string;
  CreatedDate: string;
  UpdatedDate: string;
}


export interface CandidateDocument {
  id: number;
  candidate_id: number;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  uploaded_at: Date;
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
  last_action_date: Date;
}

export interface CandidatesByRole {
  job_role: string;
  total_candidates: number;
  accepted: number;
  rejected: number;
  in_progress: number;
}
