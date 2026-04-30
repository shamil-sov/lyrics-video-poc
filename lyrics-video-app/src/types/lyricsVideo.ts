export type LyricsVideoStatus =
  | 'Pending'
  | 'Transcribing'
  | 'GeneratingVideo'
  | 'Completed'
  | 'Failed'

export type SourceType = 'BandLabTrack' | 'UploadedFile'

export type EvaluationStatus = 'Pending' | 'Evaluating' | 'Completed' | 'Failed'

export type EvaluationWinner = 'OpenAI' | 'GoogleChirp3' | 'Tie' | 'BothBad'

export type CommentWinnerTag = 'OpenAI' | 'GoogleCloud' | 'Both' | 'None' | 'NotSure'

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

export interface LyricsVideoComment {
  id: string
  jobId: string
  text: string
  winnerTag: CommentWinnerTag
  createdAt: string
}

export interface LyricsVideoCommentsResponse {
  items: LyricsVideoComment[]
}

export interface LyricsVideoListResponse {
  items: LyricsVideoJob[]
  averages?: LyricsVideoAverages | null
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
  humanEvaluated?: boolean | null
  humanWinner?: CommentWinnerTag | null
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
