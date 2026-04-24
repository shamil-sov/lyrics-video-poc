export type LyricsVideoStatus =
  | 'Pending'
  | 'Downloading'
  | 'Transcribing'
  | 'GeneratingVideo'
  | 'Uploading'
  | 'Completed'
  | 'Failed'

export interface ProviderResult {
  status: LyricsVideoStatus
  videoUrl?: string
  srtContent?: string
  errorMessage?: string
}

export interface LyricsVideoJob {
  id: string
  postId: string
  trackUrl: string
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
