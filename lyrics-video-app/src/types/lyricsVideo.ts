export type LyricsVideoStatus =
  | 'Pending'
  | 'Transcribing'
  | 'GeneratingVideo'
  | 'Completed'
  | 'Failed'

export type SourceType = 'BandLabTrack' | 'UploadedFile'

export type EvaluationStatus = 'Pending' | 'Evaluating' | 'Completed' | 'Failed'

export type EvaluationWinner = 'OpenAI' | 'GoogleChirp3' | 'Tie' | 'BothBad'

export type ProviderReviewStatus = 'Approved' | 'Rejected' | 'Questionable'

export interface ProviderTimings {
  transcriptionMs?: number | null
  videoGenerationMs?: number | null
  backgroundDownloadMs?: number | null
  ffmpegMs?: number | null
  uploadMs?: number | null
  totalMs?: number | null
  videoSizeBytes?: number | null
}

export interface ProviderResult {
  status: LyricsVideoStatus
  videoUrl?: string | null
  srtContent?: string | null
  errorMessage?: string | null
  timings?: ProviderTimings | null
}

export interface LyricsVideoEvaluation {
  status: EvaluationStatus
  winner?: EvaluationWinner | null
  openAiScore?: number | null
  googleChirpScore?: number | null
  summary?: string | null
  openAiIssues?: string[] | null
  googleChirpIssues?: string[] | null
  errorMessage?: string | null
  evaluationMs?: number | null
}

export interface LyricsVideoAverages {
  openAiAverage?: number | null
  googleChirpAverage?: number | null
  evaluatedCount?: number | null
}

export interface LyricsVideoHumanApprovalStats {
  approved?: number | null
  rejected?: number | null
  questionable?: number | null
  total?: number | null
}

export interface LyricsVideoHumanStats {
  openAI?: number | null
  googleCloud?: number | null
  both?: number | null
  none?: number | null
  questionable?: number | null
  total?: number | null
  openAiApproval?: LyricsVideoHumanApprovalStats | null
  googleCloudApproval?: LyricsVideoHumanApprovalStats | null
}

export interface LyricsVideoProviderReview {
  status: ProviderReviewStatus
  text?: string | null
  createdAt: string
}

export interface LyricsVideoListResponse {
  items: LyricsVideoJob[]
  averages?: LyricsVideoAverages | null
  humanStats?: LyricsVideoHumanStats | null
}

export interface LyricsVideoInsightsApprovalRateStats {
  total?: number | null
  approved?: number | null
  rejected?: number | null
  questionable?: number | null
  approvedPercent?: number | null
  rejectedPercent?: number | null
  questionablePercent?: number | null
}

export interface LyricsVideoInsightsApprovalRates {
  description?: string | null
  openAi?: LyricsVideoInsightsApprovalRateStats | null
  googleCloud?: LyricsVideoInsightsApprovalRateStats | null
}

export interface LyricsVideoInsightsGenreProvider {
  avgAiScore?: number | null
  approved?: number | null
  rejected?: number | null
  questionable?: number | null
  topIssues?: string[] | null
}

export interface LyricsVideoInsightsGenreBreakdownItem {
  description?: string | null
  genreSlug?: string | null
  genreName?: string | null
  jobCount?: number | null
  openAi?: LyricsVideoInsightsGenreProvider | null
  googleCloud?: LyricsVideoInsightsGenreProvider | null
}

export interface LyricsVideoInsightsAgreement {
  description?: string | null
  totalCompared?: number | null
  agreed?: number | null
  disagreed?: number | null
  agreementPercent?: number | null
}

export interface LyricsVideoInsightsPerformanceProvider {
  avgTranscriptionMs?: number | null
  avgVideoGenerationMs?: number | null
  avgFfmpegMs?: number | null
  avgUploadMs?: number | null
  avgTotalMs?: number | null
  avgVideoSizeBytes?: number | null
}

export interface LyricsVideoInsightsPerformance {
  description?: string | null
  openAi?: LyricsVideoInsightsPerformanceProvider | null
  googleCloud?: LyricsVideoInsightsPerformanceProvider | null
}

export interface LyricsVideoInsightsHeadToHead {
  description?: string | null
  totalEvaluated?: number | null
  aiOpenAiWins?: number | null
  aiGoogleCloudWins?: number | null
  aiTies?: number | null
  humanOpenAiWins?: number | null
  humanGoogleCloudWins?: number | null
  humanBoth?: number | null
}

export interface LyricsVideoInsightsIssuesSummary {
  description?: string | null
  openAiSummary?: string | null
  googleCloudSummary?: string | null
  basedOnJobCount?: number | null
}

export interface LyricsVideoInsightsStrategyOption {
  label?: string | null
  avgScore?: number | null
  scoreImprovement?: number | null
  approvedCount?: number | null
  approvedPercent?: number | null
  rejectedCount?: number | null
  rejectedPercent?: number | null
  timesSelected?: number | null
  selectionPercent?: number | null
}

export interface LyricsVideoInsightsStrategyComparison {
  description?: string | null
  totalEvaluated?: number | null
  openAiOnly?: LyricsVideoInsightsStrategyOption | null
  googleCloudOnly?: LyricsVideoInsightsStrategyOption | null
  mixed?: LyricsVideoInsightsStrategyOption | null
  recommendation?: string | null
}

export interface LyricsVideoInsightsMixedApproach {
  question?: string | null
  answer?: string | null
}

export interface LyricsVideoInsightsAiScores {
  description?: string | null
  totalEvaluated?: number | null
  openAiAvgScore?: number | null
  googleCloudAvgScore?: number | null
}

export interface LyricsVideoInsightsResponse {
  approvalRates?: LyricsVideoInsightsApprovalRates | null
  genreBreakdown?: LyricsVideoInsightsGenreBreakdownItem[] | null
  aiVsHumanAgreement?: LyricsVideoInsightsAgreement | null
  performance?: LyricsVideoInsightsPerformance | null
  headToHead?: LyricsVideoInsightsHeadToHead | null
  issuesSummary?: LyricsVideoInsightsIssuesSummary | null
  strategyComparison?: LyricsVideoInsightsStrategyComparison | null
  mixedApproach?: LyricsVideoInsightsMixedApproach | null
  aiScores?: LyricsVideoInsightsAiScores | null
}

export interface JobMetadata {
  songName?: string | null
  songPictureUrl?: string | null
  creatorName?: string | null
  genreSlug?: string | null
  genreName?: string | null
}

export interface LyricsVideoJob {
  id: string
  sourceType: SourceType
  postId?: string | null
  trackUrl?: string | null
  fileName?: string | null
  metadata?: JobMetadata | null
  openAi: ProviderResult
  googleChirp: ProviderResult
  geminiFlash?: ProviderResult | null
  evaluation?: LyricsVideoEvaluation | null
  openAiApproval?: LyricsVideoProviderReview | null
  googleCloudApproval?: LyricsVideoProviderReview | null
  createdAt: string
  updatedAt: string
}

export interface TriggerResponse {
  jobId: string
  openAi: { status: LyricsVideoStatus }
  googleChirp: { status: LyricsVideoStatus }
}

export const TERMINAL_STATUSES: LyricsVideoStatus[] = ['Completed', 'Failed']

export const EVALUATION_TERMINAL_STATUSES: EvaluationStatus[] = ['Completed', 'Failed']

export function isTerminal(status: LyricsVideoStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export function isEvaluationTerminal(status: EvaluationStatus): boolean {
  return EVALUATION_TERMINAL_STATUSES.includes(status)
}

export function isJobComplete(job: LyricsVideoJob): boolean {
  const providersComplete = isTerminal(job.openAi.status) && isTerminal(job.googleChirp.status)
  const evaluationComplete = job.evaluation == null || isEvaluationTerminal(job.evaluation.status)
  return providersComplete && evaluationComplete
}
