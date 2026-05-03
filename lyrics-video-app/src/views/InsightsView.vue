<template>
  <v-container class="py-6 insights-view">
    <section class="insights-hero mb-6">
      <div>
        <div class="insights-eyebrow mb-2">Shareable analytics</div>
        <h1 class="text-h4 font-weight-bold mb-2">Lyrics Video Insights</h1>
        <p class="insights-lead mb-0">
          Team-facing quality, performance, and review analytics for all generated videos.
        </p>
      </div>
    </section>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else>
      <v-alert v-if="!insights" type="info" variant="tonal" class="mb-4">
        No insights are available yet.
      </v-alert>

      <template v-else>
        <section class="insights-grid mb-6">
          <v-sheet class="insights-panel pa-5" border rounded="xl">
            <div class="insights-panel__header mb-3">
              <div>
                <div class="insights-panel__eyebrow">Review quality</div>
                <div class="text-h6 font-weight-medium">Manual Review</div>
              </div>
              <v-icon color="primary" icon="mdi-account-check-outline" />
            </div>

            <p class="insights-note mb-4">{{ insights.approvalRates?.description || 'Approval, rejection, and questionable rates by provider.' }}</p>

            <div class="provider-card-grid">
              <v-sheet
                v-for="provider in approvalRateCards"
                :key="provider.id"
                class="metric-card pa-4"
                border
                rounded="xl"
              >
                <div class="d-flex align-center justify-space-between ga-3 mb-3">
                  <div>
                    <div class="metric-card__title">{{ provider.label }}</div>
                    <div class="metric-card__subtitle">{{ formatReviewedVideos(provider.total) }}</div>
                  </div>
                </div>

                <div class="metric-rows">
                  <div v-for="metric in provider.metrics" :key="metric.id" class="metric-row">
                    <div class="d-flex align-center justify-space-between ga-3 mb-1">
                      <span class="metric-row__label">{{ metric.label }}</span>
                      <span class="metric-row__value">{{ formatMetricCount(metric.count, provider.total, metric.percent) }}</span>
                    </div>
                    <v-progress-linear
                      :model-value="metric.percent || 0"
                      :color="metric.color"
                      bg-color="grey-lighten-1"
                      rounded
                      height="8"
                    />
                  </div>
                </div>
              </v-sheet>
            </div>
          </v-sheet>
        </section>

        <v-sheet class="insights-panel pa-5 mb-6" border rounded="xl">
          <div class="insights-panel__header mb-3">
            <div>
              <div class="insights-panel__eyebrow">Gemini evaluation</div>
              <div class="text-h6 font-weight-medium">AI Scores</div>
            </div>
            <v-chip size="small" variant="tonal" color="secondary">
              {{ formatNumber(insights.aiScores?.totalEvaluated) }} evaluated
            </v-chip>
          </div>

          <p class="insights-note mb-4">
            {{ insights.aiScores?.description || 'Average AI evaluation scores per provider (0-10 scale, rated by Gemini).' }}
          </p>

          <div class="provider-card-grid">
            <v-sheet class="metric-card pa-4" border rounded="xl">
              <div class="d-flex align-center justify-space-between ga-3 mb-3">
                <div>
                  <div class="metric-card__title">OpenAI</div>
                  <div class="metric-card__subtitle">Average Gemini score</div>
                </div>
                <v-icon color="primary" icon="mdi-robot" />
              </div>

              <div class="insight-stat-card">
                <span class="insight-stat-card__label">Average score</span>
                <span class="insight-stat-card__value">{{ formatScore(insights.aiScores?.openAiAvgScore) }}</span>
              </div>
            </v-sheet>

            <v-sheet class="metric-card pa-4" border rounded="xl">
              <div class="d-flex align-center justify-space-between ga-3 mb-3">
                <div>
                  <div class="metric-card__title">Google Cloud</div>
                  <div class="metric-card__subtitle">Average Gemini score</div>
                </div>
                <v-icon color="secondary" icon="mdi-google" />
              </div>

              <div class="insight-stat-card">
                <span class="insight-stat-card__label">Average score</span>
                <span class="insight-stat-card__value">{{ formatScore(insights.aiScores?.googleCloudAvgScore) }}</span>
              </div>
            </v-sheet>
          </div>
        </v-sheet>

        <v-sheet
          v-if="insights.mixedApproach"
          class="insights-panel pa-5 mb-6"
          border
          rounded="xl"
        >
          <div class="insights-panel__header mb-3">
            <div>
              <div class="text-h6 font-weight-medium">
                {{ insights.mixedApproach.question || 'Would it be optimal to generate subtitles with both providers and let Gemini choose the best one per track?' }}
              </div>
            </div>
            <v-icon color="primary" icon="mdi-source-merge" />
          </div>

          <div class="mixed-approach-content">
            <p class="mixed-approach__insight mb-0">
              {{ insights.mixedApproach.answer || 'No mixed-approach recommendation is available yet.' }}
            </p>
          </div>
        </v-sheet>

        <v-sheet class="insights-panel pa-5 mb-6" border rounded="xl">
          <div class="insights-panel__header mb-3">
            <div>
              <div class="insights-panel__eyebrow">Patterns by genre</div>
              <div class="text-h6 font-weight-medium">Genre Breakdown</div>
            </div>
            <v-icon color="primary" icon="mdi-shape-outline" />
          </div>

          <p class="insights-note mb-4">
            Compare provider quality, approval outcomes, and the most common issues for each genre.
          </p>

          <v-expansion-panels
            v-model="expandedGenrePanels"
            multiple
            variant="accordion"
            class="genre-panels"
          >
            <v-expansion-panel
              v-for="(genre, index) in insights.genreBreakdown || []"
              :key="genrePanelValue(genre, index)"
              :value="genrePanelValue(genre, index)"
              rounded="xl"
              class="genre-panel"
            >
              <v-expansion-panel-title>
                <div class="genre-panel__title-wrap">
                  <div>
                    <div class="genre-panel__title">{{ genre.genreName || 'Unknown genre' }}</div>
                    <div class="genre-panel__subtitle">{{ genre.description || 'Genre-specific provider breakdown.' }}</div>
                  </div>
                  <v-chip size="small" variant="tonal" color="primary">{{ formatNumber(genre.jobCount) }} videos</v-chip>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <div class="provider-card-grid">
                  <v-sheet
                    v-for="provider in genreProviderCards(genre)"
                    :key="provider.id"
                    class="metric-card pa-4"
                    border
                    rounded="xl"
                  >
                    <div class="d-flex align-center justify-space-between ga-3 mb-3">
                      <div>
                        <div class="metric-card__title">{{ provider.label }}</div>
                        <div class="metric-card__subtitle">{{ formatReviewedCoverage(provider.totalReviewed, provider.totalVideos) }}</div>
                      </div>
                      <v-icon :color="provider.color" :icon="provider.icon" />
                    </div>

                    <div class="metric-card__subtitle mb-2">Review rates</div>

                    <div class="metric-rows genre-metric-rows mb-4">
                      <div v-for="metric in provider.reviewMetrics" :key="metric.id" class="metric-row">
                        <div class="d-flex align-center justify-space-between ga-3 mb-1">
                          <span class="metric-row__label">{{ metric.label }}</span>
                          <span class="metric-row__value">{{ formatMetricRatio(metric.count, provider.totalReviewed) }}</span>
                        </div>
                        <v-progress-linear
                          :model-value="metric.percent || 0"
                          :color="metric.color"
                          bg-color="grey-lighten-1"
                          rounded
                          height="8"
                        />
                      </div>
                    </div>

                    <div>
                      <div class="metric-card__subtitle mb-2">Top issues</div>
                      <ul v-if="provider.issues.length" class="issues-list">
                        <li v-for="issue in provider.issues" :key="issue">{{ issue }}</li>
                      </ul>
                      <p v-else class="insights-note mb-0">No recurring issues reported.</p>
                    </div>
                  </v-sheet>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-sheet>
      </template>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getInsights } from '@/services/api'
import type {
  LyricsVideoInsightsApprovalRateStats,
  LyricsVideoInsightsGenreBreakdownItem,
  LyricsVideoInsightsGenreProvider,
  LyricsVideoInsightsResponse,
} from '@/types/lyricsVideo'

const insights = ref<LyricsVideoInsightsResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const expandedGenrePanels = ref<string[]>([])

const approvalRateCards = computed(() => {
  return [
    createApprovalRateCard('openAi', 'OpenAI', 'primary', insights.value?.approvalRates?.openAi),
    createApprovalRateCard('googleCloud', 'Google Cloud', 'secondary', insights.value?.approvalRates?.googleCloud),
  ]
})

const headToHeadCards = computed(() => {
  const headToHead = insights.value?.headToHead

  return [
    { id: 'total', label: 'Total evaluated', value: formatNumber(headToHead?.totalEvaluated) },
    { id: 'ai-openai', label: 'AI OpenAI wins', value: formatNumber(headToHead?.aiOpenAiWins) },
    { id: 'ai-google', label: 'AI Google wins', value: formatNumber(headToHead?.aiGoogleCloudWins) },
    { id: 'ai-ties', label: 'AI ties', value: formatNumber(headToHead?.aiTies) },
    { id: 'human-openai', label: 'Human OpenAI wins', value: formatNumber(headToHead?.humanOpenAiWins) },
    { id: 'human-google', label: 'Human Google wins', value: formatNumber(headToHead?.humanGoogleCloudWins) },
    { id: 'human-both', label: 'Human both good', value: formatNumber(headToHead?.humanBoth) },
  ]
})

onMounted(loadInsights)

async function loadInsights() {
  loading.value = true
  error.value = null

  try {
    insights.value = await getInsights()
    expandedGenrePanels.value = (insights.value?.genreBreakdown ?? []).map((genre, index) => genrePanelValue(genre, index))
  } catch (e: any) {
    error.value = e.message || 'Failed to load insights'
  } finally {
    loading.value = false
  }
}

function genrePanelValue(genre: LyricsVideoInsightsGenreBreakdownItem, index: number): string {
  return genre.genreSlug || genre.genreName || `genre-${index}`
}

function createApprovalRateCard(
  id: string,
  label: string,
  color: string,
  stats?: LyricsVideoInsightsApprovalRateStats | null,
) {
  const metrics = [
    {
      id: 'approved',
      label: 'Approved',
      count: stats?.approved ?? 0,
      percent: stats?.approvedPercent ?? 0,
      color: 'success',
    },
    {
      id: 'rejected',
      label: 'Rejected',
      count: stats?.rejected ?? 0,
      percent: stats?.rejectedPercent ?? 0,
      color: 'error',
    },
    {
      id: 'questionable',
      label: 'Questionable',
      count: stats?.questionable ?? 0,
      percent: stats?.questionablePercent ?? 0,
      color: 'warning',
    },
  ]

  return {
    id,
    label,
    color,
    total: stats?.total ?? 0,
    metrics,
  }
}

function genreProviderCards(genre: LyricsVideoInsightsGenreBreakdownItem) {
  return [
    createGenreProviderCard('openAi', 'OpenAI', 'primary', 'mdi-robot', genre.openAi, genre.jobCount),
    createGenreProviderCard('googleCloud', 'Google Cloud', 'secondary', 'mdi-google', genre.googleCloud, genre.jobCount),
  ]
}

function createGenreProviderCard(
  id: string,
  label: string,
  color: string,
  icon: string,
  provider?: LyricsVideoInsightsGenreProvider | null,
  totalVideos?: number | null,
) {
  const approved = provider?.approved ?? 0
  const rejected = provider?.rejected ?? 0
  const questionable = provider?.questionable ?? 0
  const totalReviewed = approved + rejected + questionable

  return {
    id,
    label,
    color,
    icon,
    totalReviewed,
    totalVideos: totalVideos ?? 0,
    reviewMetrics: [
      {
        id: 'approved',
        label: 'Approved',
        count: approved,
        percent: totalReviewed === 0 ? 0 : (approved / totalReviewed) * 100,
        color: 'success',
      },
      {
        id: 'rejected',
        label: 'Rejected',
        count: rejected,
        percent: totalReviewed === 0 ? 0 : (rejected / totalReviewed) * 100,
        color: 'error',
      },
      {
        id: 'questionable',
        label: 'Questionable',
        count: questionable,
        percent: totalReviewed === 0 ? 0 : (questionable / totalReviewed) * 100,
        color: 'warning',
      },
    ],
    issues: provider?.topIssues ?? [],
  }
}

function formatPercent(value?: number | null): string {
  return value == null ? '--' : `${value.toFixed(1)}%`
}

function formatScore(value?: number | null): string {
  return value == null ? '--' : `${value.toFixed(1)}/10`
}

function formatNumber(value?: number | null): string {
  return value == null ? '--' : `${value}`
}

function formatReviewedVideos(value?: number | null): string {
  if (value == null) {
    return '--'
  }

  return value === 1 ? '1 video reviewed' : `${value} videos reviewed`
}

function formatMetricCount(count?: number | null, total?: number | null, percent?: number | null): string {
  if (count == null || total == null || percent == null) {
    return '--'
  }

  return `${count} of ${total} (${formatPercent(percent)})`
}

function formatMetricRatio(count?: number | null, total?: number | null): string {
  if (count == null || total == null) {
    return '--'
  }

  return `${count} of ${total}`
}

function formatReviewedCoverage(reviewed?: number | null, total?: number | null): string {
  if (reviewed == null || total == null) {
    return '--'
  }

  return `${reviewed} of ${total} videos reviewed`
}
</script>

<style scoped>
.insights-view {
  max-width: 1240px;
}

.insights-hero {
  display: flex;
  align-items: end;
  justify-content: flex-start;
  gap: 20px;
  padding: 28px 32px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.22) 0%, transparent 32%),
    linear-gradient(135deg, rgba(var(--v-theme-surface), 0.98) 0%, rgba(var(--v-theme-surface), 0.88) 100%);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 18px 36px rgba(9, 14, 26, 0.14);
}

.insights-eyebrow {
  font-size: 12px;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-weight: 700;
}

.insights-lead {
  max-width: 680px;
  font-size: 15px;
  line-height: 1.6;
  color: rgba(var(--v-theme-on-surface), 0.76);
}

.insights-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.insights-panel {
  position: relative;
  background: rgba(var(--v-theme-surface), 0.98);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  box-shadow: 0 16px 30px rgba(9, 14, 26, 0.12);
  overflow: hidden;
}

.insights-panel::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: linear-gradient(90deg, rgba(var(--v-theme-primary), 0.9) 0%, rgba(var(--v-theme-info), 0.55) 100%);
}

.insights-panel__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.12);
}

.insights-panel__eyebrow {
  font-size: 11px;
  line-height: 1.2;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-weight: 700;
  margin-bottom: 6px;
}

.insights-note {
  font-size: 13px;
  line-height: 1.55;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.provider-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.metric-card__title {
  font-size: 15px;
  line-height: 1.25;
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-weight: 700;
}

.metric-card__subtitle {
  font-size: 12px;
  line-height: 1.35;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.metric-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-row__label {
  font-size: 12px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-weight: 600;
}

.metric-row__value {
  font-size: 12px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.88);
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.insight-stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.insight-stat-card__label {
  font-size: 12px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 600;
}

.insight-stat-card__value {
  font-size: 22px;
  line-height: 1.1;
  color: rgba(var(--v-theme-on-surface), 0.94);
  font-weight: 800;
}

.mixed-approach-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mixed-approach__insight {
  font-size: 16px;
  line-height: 1.55;
  color: rgba(var(--v-theme-on-surface), 0.84);
  font-weight: 700;
}

.genre-metric-rows {
  gap: 10px;
}

.genre-panels {
  gap: 12px;
  display: flex;
  flex-direction: column;
}

.genre-panel {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.genre-panel__title-wrap {
  width: 100%;
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
}

.genre-panel__title {
  font-size: 15px;
  line-height: 1.25;
  color: rgba(var(--v-theme-on-surface), 0.92);
  font-weight: 700;
}

.genre-panel__subtitle {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.64);
}

.issues-list {
  margin: 0;
  padding-left: 18px;
  color: rgba(var(--v-theme-on-surface), 0.78);
  font-size: 12px;
  line-height: 1.55;
}

.summary-text {
  font-size: 14px;
  line-height: 1.65;
  color: rgba(var(--v-theme-on-surface), 0.82);
}

@media (max-width: 960px) {
  .insights-hero,
  .provider-card-grid,
  .compact-stats-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .insights-hero {
    padding: 24px;
    align-items: start;
    flex-direction: column;
  }

  .genre-panel__title-wrap {
    align-items: start;
    flex-direction: column;
  }
}
</style>