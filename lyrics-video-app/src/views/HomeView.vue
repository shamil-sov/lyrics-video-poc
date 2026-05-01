<template>
  <v-container class="py-6" style="max-width: 1100px">
    <!-- Generate Section -->
    <v-card class="mb-6">
      <v-card-title class="text-h6 pb-0 pt-4 px-4">
        <v-icon class="mr-2" color="primary">mdi-video-plus</v-icon>
        Generate Lyrics Video
      </v-card-title>

      <v-tabs v-model="inputTab" color="primary" class="px-4">
        <v-tab value="url">
          <v-icon start>mdi-link</v-icon>
          Track URL
        </v-tab>
        <v-tab value="file">
          <v-icon start>mdi-upload</v-icon>
          Upload File
        </v-tab>
      </v-tabs>

      <v-card-text>
        <!-- URL Tab -->
        <v-form ref="urlForm" v-if="inputTab === 'url'" @submit.prevent="handleUrlSubmit" class="d-flex align-center ga-3">
          <v-text-field
            v-model="trackUrl"
            label="BandLab Track URL"
            placeholder="https://www.bandlab.com/post/..."
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :rules="[rules.required, rules.url]"
            :disabled="submitting"
            prepend-inner-icon="mdi-link"
            class="flex-grow-1"
          />
          <v-btn
            type="submit"
            color="primary"
            size="large"
            :loading="submitting"
            :disabled="!isValidUrl"
            prepend-icon="mdi-creation"
          >
            Generate
          </v-btn>
        </v-form>

        <!-- File Upload Tab -->
        <div v-else class="d-flex align-center ga-3">
          <v-file-input
            v-model="selectedFile"
            label="Audio file"
            placeholder="Select an audio file (mp3, m4a, wav, ogg, flac...)"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            accept="audio/*"
            :disabled="submitting"
            prepend-icon=""
            prepend-inner-icon="mdi-music-box"
            class="flex-grow-1"
          />
          <v-btn
            color="primary"
            size="large"
            :loading="submitting"
            :disabled="!selectedFile"
            prepend-icon="mdi-creation"
            @click="handleFileSubmit"
          >
            Generate
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Jobs List -->
    <template v-else>
      <div class="jobs-layout" :class="{ 'jobs-layout--with-sidebar': hasSidebarStats }">
        <div class="jobs-main">
          <div class="jobs-toolbar mb-4">
            <div class="d-flex align-center ga-2 flex-wrap">
              <h2 class="text-h6">
                <v-icon class="mr-1">mdi-format-list-bulleted</v-icon>
                Jobs
              </h2>
              <v-chip size="small" color="primary" variant="tonal">
                {{ filteredJobs.length }}
              </v-chip>
              <v-chip v-if="hasActiveFilters" size="small" variant="text">
                {{ jobs.length }} total
              </v-chip>
            </div>

            <div class="jobs-toolbar-actions">
              <v-select
                v-model="selectedGenreFilter"
                :items="genreFilterOptions"
                item-title="title"
                item-value="value"
                label="Filter by genre"
                variant="outlined"
                density="comfortable"
                hide-details
                class="jobs-filter-select"
              />

              <v-select
                v-model="selectedHumanReviewFilter"
                :items="humanReviewFilterOptions"
                item-title="title"
                item-value="value"
                label="Filter by human review"
                variant="outlined"
                density="comfortable"
                hide-details
                class="jobs-filter-select"
              />

              <v-btn
                variant="text"
                size="small"
                icon="mdi-refresh"
                @click="loadJobs"
                :loading="loading"
              />
            </div>
          </div>

          <div v-if="genreCounts.length" class="genre-filter-chips mb-4">
            <v-chip
              v-for="genre in genreFilterOptions"
              :key="genre.value"
              :color="selectedGenreFilter === genre.value ? 'primary' : undefined"
              :variant="selectedGenreFilter === genre.value ? 'flat' : 'tonal'"
              size="small"
              class="genre-filter-chip"
              @click="selectedGenreFilter = genre.value"
            >
              {{ genre.genreName }} ({{ genre.count }})
            </v-chip>
          </div>

          <div v-if="jobs.length === 0" class="text-center py-12 text-medium-emphasis">
            <v-icon size="64" class="mb-4" color="grey-lighten-1">mdi-video-off-outline</v-icon>
            <p class="text-body-1">No jobs yet. Paste a track URL or upload an audio file to get started.</p>
          </div>

          <div v-else-if="filteredJobs.length === 0" class="text-center py-12 text-medium-emphasis">
            <v-icon size="64" class="mb-4" color="grey-lighten-1">mdi-filter-outline</v-icon>
            <p class="text-body-1">No jobs match the selected filters.</p>
          </div>

          <div v-else class="d-flex flex-column ga-4">
            <JobCard
              v-for="job in filteredJobs"
              :key="job.id"
              :job="job"
              :deleting="deletingJobId === job.id"
              @remove="handleDelete"
              @review-updated="handleReviewUpdated"
            />
          </div>
        </div>

        <aside v-if="hasSidebarStats" class="jobs-sidebar">
          <v-sheet
            v-if="hasGlobalScores"
            class="pa-4 scores-overview"
            border
            rounded="xl"
          >
            <div class="d-flex align-center ga-2 flex-wrap mb-3">
              <v-icon color="primary">mdi-chart-box-outline</v-icon>
              <span class="text-subtitle-2 font-weight-medium">Global AI evaluation scores</span>
            </div>

            <p v-if="globalScoreBars.length" class="scores-overview-note mb-3">
              Higher bars mean better average evaluation across all reviewed jobs.
            </p>

            <div v-if="globalScoreBars.length" class="scores-overview-bars mb-4">
              <div
                v-for="scoreBar in globalScoreBars"
                :key="scoreBar.id"
                class="scores-overview-bar-card"
              >
                <div class="scores-overview-bar-header mb-2">
                  <div class="d-flex align-center ga-2 flex-wrap">
                    <span class="scores-overview-label">{{ scoreBar.label }}</span>
                    <span class="scores-overview-bar-value">{{ formatAverage(scoreBar.value) }}</span>
                  </div>
                </div>

                <v-progress-linear
                  :model-value="scoreBar.percent"
                  :color="scoreBar.color"
                  bg-color="grey-lighten-3"
                  rounded
                  height="14"
                />

                <div class="scores-overview-bar-scale mt-2">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            <div class="scores-overview-grid">
              <div class="scores-overview-card">
                <span class="scores-overview-label">Compared on</span>
                <span class="scores-overview-value">{{ averages?.evaluatedCount ?? 0 }} jobs</span>
              </div>
              <div class="scores-overview-card">
                <span class="scores-overview-label">Evaluated jobs</span>
                <span class="scores-overview-value">{{ averages?.evaluatedCount ?? 0 }}</span>
              </div>
            </div>
          </v-sheet>

          <v-sheet
            v-if="hasHumanStats"
            class="pa-4 human-stats-overview"
            border
            rounded="xl"
          >
            <div class="d-flex align-center ga-2 flex-wrap mb-3">
              <v-icon color="primary">mdi-account-check-outline</v-icon>
              <span class="text-subtitle-2 font-weight-medium">Human evaluation summary</span>
            </div>

            <p class="scores-overview-note mb-3">
              Human approval breakdown per provider.
            </p>

            <div v-if="humanOutcomeCards.length" class="human-outcome-grid mb-4">
              <div
                v-for="outcome in humanOutcomeCards"
                :key="outcome.id"
                class="human-outcome-card"
                :style="{ borderColor: outcome.colorCss }"
              >
                <span class="human-outcome-label">{{ outcome.label }}</span>
                <span class="human-outcome-value">{{ outcome.value }}</span>
              </div>
            </div>

            <div v-if="humanProviderBars.length" class="human-provider-stats">
              <div
                v-for="provider in humanProviderBars"
                :key="provider.id"
                class="human-provider-card"
              >
                <div class="human-provider-header mb-2">
                  <span class="scores-overview-label">{{ provider.label }}</span>
                  <span class="human-provider-total">{{ provider.total }} reviews</span>
                </div>

                <div class="human-provider-metrics mt-3">
                  <div
                    v-for="segment in provider.segments"
                    :key="segment.id"
                    class="human-provider-metric"
                    :style="{ borderColor: segment.colorCss }"
                  >
                    <span class="human-provider-metric-label">{{ segment.label }}</span>
                    <span class="human-provider-metric-value">{{ segment.count }}</span>
                    <span class="human-provider-metric-share">{{ formatPercent(segment.percent) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <p v-else class="scores-overview-note mb-0">
              No human reviews yet.
            </p>
          </v-sheet>
        </aside>
      </div>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useLyricsJobs } from '@/composables/useLyricsJobs'
import JobCard from '@/components/JobCard.vue'
import type {
  LyricsVideoHumanApprovalStats,
  LyricsVideoJob,
  LyricsVideoProviderReview,
  ProviderReviewStatus,
} from '@/types/lyricsVideo'

const { jobs, averages, humanStats, loading, submitting, deletingJobId, error, loadJobs, submitJob, submitFile, removeJob } = useLyricsJobs()

const ALL_GENRES = '__all__'
const NO_GENRE = '__no-genre__'
const ALL_HUMAN_REVIEWS = '__all-human-reviews__'
const NOT_REVIEWED = '__not-reviewed__'

type HumanReviewFilterValue = ProviderReviewStatus | typeof ALL_HUMAN_REVIEWS | typeof NOT_REVIEWED

const inputTab = ref('url')
const urlForm = ref<{ resetValidation: () => void } | null>(null)
const trackUrl = ref('')
const selectedFile = ref<File | undefined>()
const selectedGenreFilter = ref(ALL_GENRES)
const selectedHumanReviewFilter = ref<HumanReviewFilterValue>(ALL_HUMAN_REVIEWS)

const rules = {
  required: (v: string) => !!v || 'Track URL is required',
  url: (v: string) => /^https?:\/\/.+/.test(v) || 'Must be a valid URL',
}

const isValidUrl = computed(() => {
  return trackUrl.value.length > 0 && /^https?:\/\/.+/.test(trackUrl.value)
})

const hasGlobalScores = computed(() => {
  return averages.value?.openAiAverage != null
    || averages.value?.googleChirpAverage != null
    || averages.value?.evaluatedCount != null
})

const hasHumanStats = computed(() => {
  return humanStats.value != null
})

const hasSidebarStats = computed(() => {
  return hasGlobalScores.value || hasHumanStats.value
})

const hasActiveFilters = computed(() => {
  return selectedGenreFilter.value !== ALL_GENRES
    || selectedHumanReviewFilter.value !== ALL_HUMAN_REVIEWS
})

const globalScoreBars = computed(() => {
  const bars = [
    {
      id: 'openAi',
      label: 'OpenAI',
      value: averages.value?.openAiAverage ?? null,
      color: 'primary',
    },
    {
      id: 'googleChirp',
      label: 'Google',
      value: averages.value?.googleChirpAverage ?? null,
      color: 'secondary',
    },
  ]

  return bars
    .filter((bar) => bar.value != null)
    .map((bar) => ({
      ...bar,
      percent: scoreToPercent(bar.value),
    }))
})

const humanOutcomeCards = computed(() => {
  if (!humanStats.value) {
    return []
  }

  const outcomes = [
    { id: 'openAI', label: 'OpenAI wins', value: humanStats.value.openAI ?? 0, color: 'primary' },
    { id: 'googleCloud', label: 'Google wins', value: humanStats.value.googleCloud ?? 0, color: 'secondary' },
    { id: 'both', label: 'Both', value: humanStats.value.both ?? 0, color: 'info' },
    { id: 'none', label: 'None', value: humanStats.value.none ?? 0, color: 'error' },
    { id: 'notSure', label: 'Not sure', value: humanStats.value.notSure ?? 0, color: 'warning' },
  ]

  return outcomes
    .filter(outcome => outcome.value > 0)
    .map(outcome => ({
      ...outcome,
      colorCss: themeColorCss(outcome.color),
    }))
})

const humanProviderBars = computed(() => {
  if (!humanStats.value) {
    return []
  }

  return [
    createHumanProviderBar('openAi', 'OpenAI approval status', humanStats.value.openAiApproval),
    createHumanProviderBar('googleCloud', 'Google approval status', humanStats.value.googleCloudApproval),
  ].filter(provider => provider.total > 0)
})

const genreCounts = computed(() => {
  const counts = new Map<string, { value: string; genreName: string; count: number }>()

  for (const job of jobs.value) {
    if (!matchesHumanReviewFilter(job, selectedHumanReviewFilter.value)) {
      continue
    }

    const value = job.metadata?.genreSlug ?? NO_GENRE
    const genreName = job.metadata?.genreName ?? 'No genre'
    const existing = counts.get(value)

    if (existing) {
      existing.count += 1
      continue
    }

    counts.set(value, { value, genreName, count: 1 })
  }

  return Array.from(counts.values()).sort((left, right) => {
    if (left.value === NO_GENRE) return 1
    if (right.value === NO_GENRE) return -1
    return left.genreName.localeCompare(right.genreName)
  })
})

const genreFilterOptions = computed(() => {
  return [
    {
      title: `All genres (${jobs.value.filter(job => matchesHumanReviewFilter(job, selectedHumanReviewFilter.value)).length})`,
      value: ALL_GENRES,
      genreName: 'All genres',
      count: jobs.value.filter(job => matchesHumanReviewFilter(job, selectedHumanReviewFilter.value)).length,
    },
    ...genreCounts.value.map(genre => ({
      title: `${genre.genreName} (${genre.count})`,
      value: genre.value,
      genreName: genre.genreName,
      count: genre.count,
    })),
  ]
})

const humanReviewFilterOptions = computed(() => {
  const jobsInSelectedGenre = jobs.value.filter(job => matchesGenreFilter(job, selectedGenreFilter.value))

  const options: Array<{ label: string; value: HumanReviewFilterValue; count: number }> = [
    {
      label: 'All reviews',
      value: ALL_HUMAN_REVIEWS,
      count: jobsInSelectedGenre.length,
    },
    {
      label: 'Approved',
      value: 'Approved',
      count: jobsInSelectedGenre.filter(job => matchesHumanReviewFilter(job, 'Approved')).length,
    },
    {
      label: 'Rejected',
      value: 'Rejected',
      count: jobsInSelectedGenre.filter(job => matchesHumanReviewFilter(job, 'Rejected')).length,
    },
    {
      label: 'Not sure',
      value: 'NotSure',
      count: jobsInSelectedGenre.filter(job => matchesHumanReviewFilter(job, 'NotSure')).length,
    },
    {
      label: 'Not reviewed',
      value: NOT_REVIEWED,
      count: jobsInSelectedGenre.filter(job => matchesHumanReviewFilter(job, NOT_REVIEWED)).length,
    },
  ]

  return options.map(option => ({
    ...option,
    title: `${option.label} (${option.count})`,
  }))
})

const filteredJobs = computed(() => {
  return jobs.value.filter(job => {
    return matchesGenreFilter(job, selectedGenreFilter.value)
      && matchesHumanReviewFilter(job, selectedHumanReviewFilter.value)
  })
})

function matchesGenreFilter(job: LyricsVideoJob, filterValue: string): boolean {
  if (filterValue === ALL_GENRES) {
    return true
  }

  const genreSlug = job.metadata?.genreSlug ?? NO_GENRE
  return genreSlug === filterValue
}

function matchesHumanReviewFilter(job: LyricsVideoJob, filterValue: HumanReviewFilterValue): boolean {
  if (filterValue === ALL_HUMAN_REVIEWS) {
    return true
  }

  const openAiReview = job.openAiApproval?.status ?? null
  const googleReview = job.googleCloudApproval?.status ?? null

  if (filterValue === NOT_REVIEWED) {
    return openAiReview == null || googleReview == null
  }

  return openAiReview === filterValue || googleReview === filterValue
}

function scoreToPercent(value?: number | null): number {
  if (value == null) {
    return 0
  }

  return Math.max(0, Math.min(100, (value / 10) * 100))
}

function createHumanProviderBar(
  id: string,
  label: string,
  stats?: LyricsVideoHumanApprovalStats | null,
) {
  const rawSegments = [
    { id: 'approved', label: 'Approved', count: stats?.approved ?? 0, color: 'success' },
    { id: 'rejected', label: 'Rejected', count: stats?.rejected ?? 0, color: 'error' },
    { id: 'notSure', label: 'Not sure', count: stats?.notSure ?? 0, color: 'warning' },
  ]

  const fallbackTotal = rawSegments.reduce((sum, segment) => sum + segment.count, 0)
  const total = stats?.total && stats.total > 0 ? stats.total : fallbackTotal

  return {
    id,
    label,
    total,
    segments: rawSegments.map(segment => ({
      ...segment,
      percent: total > 0 ? (segment.count / total) * 100 : 0,
      colorCss: themeColorCss(segment.color),
    })),
  }
}

function themeColorCss(color: string): string {
  return `rgb(var(--v-theme-${color}))`
}

function formatAverage(value?: number | null): string {
  return value == null ? '--' : `${value.toFixed(1)}/10`
}

function formatPercent(value?: number | null): string {
  if (value == null) {
    return '--'
  }

  return `${Math.round(value)}%`
}

async function handleUrlSubmit() {
  if (!isValidUrl.value) return
  const submitted = await submitJob(trackUrl.value)
  if (!submitted) return

  trackUrl.value = ''
  await nextTick()
  urlForm.value?.resetValidation()
}

async function handleFileSubmit() {
  if (!selectedFile.value) return
  const submitted = await submitFile(selectedFile.value)
  if (!submitted) return

  selectedFile.value = undefined
}

async function handleDelete(jobId: string) {
  const confirmed = window.confirm('Delete this lyrics video job? This cannot be undone.')
  if (!confirmed) return

  await removeJob(jobId)
}

function handleReviewUpdated(payload: {
  jobId: string
  provider: 'openAi' | 'google'
  review: LyricsVideoProviderReview | null
}) {
  jobs.value = jobs.value.map((job: LyricsVideoJob) => {
    if (job.id !== payload.jobId) {
      return job
    }

    return {
      ...job,
      openAiApproval: payload.provider === 'openAi' ? payload.review : job.openAiApproval,
      googleCloudApproval: payload.provider === 'google' ? payload.review : job.googleCloudApproval,
    }
  })
}

onMounted(loadJobs)
</script>

<style scoped>
.jobs-layout {
  display: block;
}

.jobs-layout--with-sidebar {
  position: relative;
  overflow: visible;
}

.jobs-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.jobs-toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.jobs-filter-select {
  min-width: 240px;
  max-width: 320px;
}

.genre-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.genre-filter-chip {
  cursor: pointer;
}

.jobs-sidebar {
  position: absolute;
  top: 24px;
  left: calc(100% + 20px);
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scores-overview,
.human-stats-overview {
  background: rgba(var(--v-theme-surface), 0.98);
}

.scores-overview-note {
  font-size: 12px;
  line-height: 1.45;
  color: rgba(var(--v-theme-on-surface), 0.64);
}

.scores-overview-bars {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.scores-overview-bar-card {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.scores-overview-bar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.scores-overview-bar-value {
  font-size: 13px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.86);
  font-weight: 700;
}

.scores-overview-bar-scale {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.52);
  font-weight: 600;
}

.scores-overview-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.human-outcome-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.human-outcome-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-left-width: 4px;
}

.human-outcome-label {
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-weight: 600;
}

.human-outcome-value {
  font-size: 18px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-weight: 700;
}

.human-provider-stats {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.human-provider-card {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.human-provider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.human-provider-total {
  font-size: 12px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-weight: 600;
}

.human-provider-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.human-provider-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface), 0.96);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-left-width: 4px;
}

.human-provider-metric-label {
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-weight: 600;
}

.human-provider-metric-value {
  font-size: 18px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-weight: 700;
}

.human-provider-metric-share {
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-weight: 600;
}

.scores-overview-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.scores-overview-label {
  font-size: 12px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-weight: 600;
}

.scores-overview-value {
  font-size: 18px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-weight: 700;
}

@media (max-width: 1460px) {
  .jobs-layout--with-sidebar {
    display: block;
  }

  .jobs-sidebar {
    position: static;
    width: auto;
    margin-top: 16px;
  }

  .scores-overview-bar-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .human-provider-header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  .jobs-toolbar,
  .jobs-toolbar-actions {
    align-items: stretch;
  }

  .jobs-filter-select {
    min-width: 0;
    max-width: none;
    width: 100%;
  }

  .human-outcome-grid,
  .human-provider-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
