import { ref, onUnmounted } from 'vue'
import type { LyricsVideoAverages, LyricsVideoHumanStats, LyricsVideoJob } from '@/types/lyricsVideo'
import { isJobComplete } from '@/types/lyricsVideo'
import { deleteJob, getAllJobs, triggerGeneration, triggerFromFile } from '@/services/api'

const POLL_INTERVAL_MS = 5000

export function useLyricsJobs() {
  const jobs = ref<LyricsVideoJob[]>([])
  const averages = ref<LyricsVideoAverages | null>(null)
  const humanStats = ref<LyricsVideoHumanStats | null>(null)
  const loading = ref(false)
  const submitting = ref(false)
  const deletingJobId = ref<string | null>(null)
  const error = ref<string | null>(null)

  let pollTimer: ReturnType<typeof setInterval> | null = null

  async function fetchJobs() {
    try {
      const data = await getAllJobs()
      jobs.value = data.items
      averages.value = data.averages ?? null
      humanStats.value = data.humanStats ?? null
      error.value = null
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch jobs'
    }
  }

  async function loadJobs() {
    loading.value = true
    await fetchJobs()
    loading.value = false
    managePoll()
  }

  async function submitJob(trackUrl: string): Promise<boolean> {
    submitting.value = true
    error.value = null
    try {
      await triggerGeneration(trackUrl)
      await fetchJobs()
      managePoll()
      return true
    } catch (e: any) {
      error.value = e.message || 'Failed to submit job'
      return false
    } finally {
      submitting.value = false
    }
  }

  async function submitFile(file: File): Promise<boolean> {
    submitting.value = true
    error.value = null
    try {
      await triggerFromFile(file)
      await fetchJobs()
      managePoll()
      return true
    } catch (e: any) {
      error.value = e.message || 'Failed to upload file'
      return false
    } finally {
      submitting.value = false
    }
  }

  async function removeJob(jobId: string) {
    deletingJobId.value = jobId
    error.value = null
    try {
      await deleteJob(jobId)
      await fetchJobs()
      managePoll()
    } catch (e: any) {
      error.value = e.message || 'Failed to delete job'
    } finally {
      deletingJobId.value = null
    }
  }

  function managePoll() {
    const hasActiveJobs = jobs.value.some(j => !isJobComplete(j))
    if (hasActiveJobs && !pollTimer) {
      pollTimer = setInterval(async () => {
        await fetchJobs()
        if (!jobs.value.some(j => !isJobComplete(j))) {
          stopPoll()
        }
      }, POLL_INTERVAL_MS)
    } else if (!hasActiveJobs && pollTimer) {
      stopPoll()
    }
  }

  function stopPoll() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  onUnmounted(stopPoll)

  return {
    jobs,
    averages,
    humanStats,
    loading,
    submitting,
    deletingJobId,
    error,
    loadJobs,
    submitJob,
    submitFile,
    removeJob,
  }
}
