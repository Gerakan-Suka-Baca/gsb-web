/**
 * University-related types shared across tryout and universitas modules.
 */

export type ProgramMetric = {
  admissionMetric?: string;
  capacity?: number;
  applicants?: number;
  predictedApplicants?: number;
  passingPercentage?: string;
  avgUkt?: string;
  maxUkt?: string;
};

export type UniversityProgramDoc = {
  id?: string;
  name?: string;
  category?: string;
  metrics?: ProgramMetric[];
  capacity?: number;
  avgUkt?: string;
  maxUkt?: string;
  admissionMetric?: string;
  applicantsPreviousYear?: number;
  predictedApplicants?: number;
  passingPercentage?: string;
  level?: string;
  accreditation?: string;
  description?: unknown;
  courses?: unknown;
  history?: unknown;
  faculty?: string;
  university?: string | { id?: string };
  universityName?: string;
  abbreviation?: string;
  status?: string;
  universityAccreditation?: string;
  website?: string;
};

export type TryoutScoreDoc = {
  finalScore?: number;
  score_PU?: number;
  score_PK?: number;
  score_PM?: number;
  score_LBE?: number;
  score_LBI?: number;
  score_PPU?: number;
  score_KMBM?: number;
  paymentType?: "free" | "paid";
};
