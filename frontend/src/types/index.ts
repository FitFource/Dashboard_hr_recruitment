export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  created_date: Date;
  updated_date: Date;
}

export interface Candidate {
  id: number;
  name: string;
  level: string;
  position: string;
  email: string;
  residence: string;
  status_id: number;
  status_label:string;
  curt: number;
  nervous: number;
  calmness: number;
  confident: number;
  enthusiast: number;
  technical_knowledge:number;
  cv_link: string;
  summary: string;
  tech_link: string;
  position_id:number;
  schedule: string;
  submit_date: String;
  phone_number:string;
  created_date: string;
  updated_date: string;
}


export interface InterviewQuestion {
  id: number;
  level: string;
  question: string;
  position: string;
  updated_date: string;
}

export interface JobRequirement {
  id: number;
  level:string;
  position: string;
  requirements: string;
  updated_date: string;
}

export interface MetricsOverview {
  total_candidates: number;
  accepted_candidates: number;
  rejected_candidates: number;
  in_progress_candidates: number;
}

export interface TopCandidate {
  id: number;
  name: string;
  email: string;
  level:string;
  submit_date: string;
  job_role: string;
  status: string;
  score: number;
  last_action_date: string;
}

export interface CandidatesByRole {
  job_role: string;
  total_candidates: number;
  accepted: number;
  rejected: number;
  in_progress: number;
}

export interface TopPosition {
  positionName: string;
  total: number;
}


export interface DashboardStats {
  totalCandidates: number;
  acceptedCandidates: number;
  rejectedCandidates: number;
  inProgressCandidates: number;
  topPositions: TopPosition[];
}

export interface DashboardStatsApi {
  total_candidates: number;
  accepted_candidates: number;
  rejected_candidates: number;
  in_progress_candidates: number;
}
