export type LyricsVideoStatus =
  | 'Pending'
  | 'Transcribing'
  | 'GeneratingVideo'
  | 'Completed'
  | 'Failed'

export type SourceType = 'BandLabTrack' | 'UploadedFile'

export interface ProviderResult {
  status: LyricsVideoStatus
  videoUrl?: string | null
  srtContent?: string | null
  errorMessage?: string | null
}

export interface JobMetadata {
  songName?: string | null
  songPictureUrl?: string | null
  creatorName?: string | null
}

export interface LyricsVideoJob {
  id: string
  sourceType: SourceType
  postId?: string | null
  trackUrl?: string | null
  metadata?: JobMetadata | null
  openAi: ProviderResult
  googleChirp: ProviderResult
  createdAt: string
  updatedAt: string
}

export interface TriggerResponse {
  jobId: string
  openAi: { status: LyricsVideoStatus }
  googleChirp: { status: LyricsVideoStatus }
}

export const TERMINAL_STATUSES: LyricsVideoStatus[] = ['Completed', 'Failed']

export function isTerminal(status: LyricsVideoStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export function isJobComplete(job: LyricsVideoJob): boolean {
  return isTerminal(job.openAi.status) && isTerminal(job.googleChirp.status)
}
