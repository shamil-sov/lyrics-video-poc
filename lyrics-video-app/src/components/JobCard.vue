<template>
  <v-card class="job-card">
    <div class="job-row px-4 py-3">
      <div class="job-main d-flex ga-3 flex-grow-1" style="min-width: 0">
        <v-avatar
          v-if="props.job.metadata?.songPictureUrl"
          size="52"
          rounded="lg"
          class="job-avatar"
        >
          <v-img :src="props.job.metadata.songPictureUrl + '100'" :alt="props.job.metadata.songName || 'Song'" />
        </v-avatar>
        <v-avatar v-else size="52" rounded="lg" color="grey-lighten-3" class="job-avatar">
          <v-icon :icon="props.job.sourceType === 'UploadedFile' ? 'mdi-file-music' : 'mdi-music-note'" color="grey" />
        </v-avatar>

        <div class="flex-grow-1" style="min-width: 0">
          <div class="d-flex align-center ga-2 flex-wrap mb-2">
            <v-chip
              size="x-small"
              variant="flat"
              :prepend-icon="sourceIcon"
              class="job-source-chip"
            >
              {{ sourceLabel }}
            </v-chip>
          </div>

          <div class="d-flex align-center ga-2 flex-wrap mb-1">
            <span v-if="props.job.metadata?.songName" class="job-title text-truncate">
              {{ props.job.metadata.songName }}
            </span>
            <span v-else class="job-title text-medium-emphasis text-truncate">
              {{ sourceLabel }}
            </span>
          </div>

          <div class="d-flex align-center ga-2 flex-wrap job-subline job-creator-line">
            <template v-if="props.job.metadata?.creatorName">
              <v-icon icon="mdi-account-circle-outline" size="x-small" />
              <span class="job-creator-name">{{ props.job.metadata.creatorName }}</span>
            </template>
            <span v-else class="job-creator-name">Lyrics video job</span>
          </div>

          <div class="d-flex align-center ga-2 flex-wrap mt-1 job-submitted-line">
            <v-icon icon="mdi-clock-outline" size="x-small" />
            <span class="job-submitted-text">Submitted on {{ formatDate(props.job.createdAt) }}</span>
          </div>

          <div v-if="props.job.trackUrl" class="d-flex align-center ga-2 flex-wrap mt-2">
            <a
              :href="props.job.trackUrl"
              target="_blank"
              rel="noopener"
              class="job-link-pill"
            >
              Track link
            </a>
          </div>
        </div>
      </div>

      <div class="job-genre-column">
        <span class="job-genre-label">Genre</span>
        <div class="job-genre-pill">
          <v-icon icon="mdi-tag-outline" size="x-small" />
          <span class="text-truncate">{{ props.job.metadata?.genreName || '--' }}</span>
        </div>
      </div>

      <div class="job-human-column">
        <div class="job-human-header">
          <span class="job-human-label">Human evaluation</span>
          <v-tooltip text="Shows whether a human has commented on this job and which provider they picked as the winner." location="top">
            <template #activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                icon="mdi-information-outline"
                size="x-small"
                class="job-human-info"
              />
            </template>
          </v-tooltip>
        </div>
        <v-chip
          v-if="effectiveHumanEvaluated && effectiveHumanWinner"
          size="small"
          variant="tonal"
          :color="commentWinnerColor(effectiveHumanWinner)"
          class="job-human-chip"
        >
          {{ commentWinnerLabel(effectiveHumanWinner) }}
        </v-chip>
        <span v-else class="job-human-empty">--</span>
      </div>

      <div class="job-statuses d-flex align-center ga-2 flex-wrap">
        <div class="job-status-card">
          <span class="job-status-label">OpenAI</span>
          <StatusChip :status="props.job.openAi.status" />
          <div v-if="props.job.openAi.timings?.totalMs != null" class="job-status-time-pill">
            <v-icon icon="mdi-timer-outline" size="x-small" />
            <span>{{ formatTiming(props.job.openAi.timings?.totalMs) }}</span>
          </div>
          <div v-if="providerScore('openAi') != null" class="job-status-score-pill">
            <v-icon icon="mdi-star-four-points-outline" size="x-small" />
            <span>{{ formatScore(providerScore('openAi')) }}</span>
          </div>
        </div>
        <div class="job-status-card">
          <span class="job-status-label">Google</span>
          <StatusChip :status="props.job.googleChirp.status" />
          <div v-if="props.job.googleChirp.timings?.totalMs != null" class="job-status-time-pill">
            <v-icon icon="mdi-timer-outline" size="x-small" />
            <span>{{ formatTiming(props.job.googleChirp.timings?.totalMs) }}</span>
          </div>
          <div v-if="providerScore('google') != null" class="job-status-score-pill">
            <v-icon icon="mdi-star-four-points-outline" size="x-small" />
            <span>{{ formatScore(providerScore('google')) }}</span>
          </div>
        </div>
      </div>

      <div class="job-actions d-flex ga-1 flex-shrink-0">
        <v-btn
          size="small"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-eye-outline"
          @click="openDetails()"
        >
          Open
        </v-btn>

        <v-btn
          size="small"
          variant="text"
          color="error"
          prepend-icon="mdi-delete-outline"
          :loading="props.deleting"
          :disabled="props.deleting"
          @click="emit('remove', props.job.id)"
        >
          Delete
        </v-btn>
      </div>
    </div>

    <v-dialog v-model="detailsOpen" max-width="1320">
      <v-card rounded="xl">
        <div class="d-flex align-center px-4 py-3 ga-3">
          <div class="flex-grow-1" style="min-width: 0">
            <div class="text-subtitle-1 font-weight-medium text-truncate">
              {{ dialogTitle }}
            </div>
            <div class="text-caption text-medium-emphasis d-flex align-center ga-2 flex-wrap">
              <span>{{ props.job.sourceType === 'UploadedFile' ? 'Uploaded file' : 'BandLab track' }}</span>
              <span>·</span>
              <span>{{ formatDate(props.job.createdAt) }}</span>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="detailsOpen = false" />
        </div>

        <v-divider />

        <v-card-text class="pa-5 details-body">
          <v-row class="details-provider-row" dense>
            <v-col cols="12" md="6">
              <v-sheet class="details-panel pa-5" border rounded="xl">
                <div class="d-flex align-center ga-2 mb-3">
                  <v-icon icon="mdi-robot" size="small" color="primary" />
                  <span class="text-subtitle-2 font-weight-medium">OpenAI Whisper</span>
                  <v-spacer />
                  <v-chip
                    v-if="providerScore('openAi') != null"
                    size="small"
                    variant="tonal"
                    color="primary"
                  >
                    AI score {{ formatScore(providerScore('openAi')) }}
                  </v-chip>
                  <StatusChip v-if="props.job.openAi.status !== 'Completed'" :status="props.job.openAi.status" />
                </div>

                <p v-if="summaryText(props.job.openAi)" class="text-body-2 text-medium-emphasis mb-3">
                  {{ summaryText(props.job.openAi) }}
                </p>

                <v-progress-linear
                  v-if="isProcessing(props.job.openAi)"
                  indeterminate
                  color="info"
                  rounded
                  class="mb-4"
                />

                <v-sheet
                  v-if="hasTimings(props.job.openAi)"
                  class="timings-panel mb-4 pa-3"
                  border
                  rounded="lg"
                >
                  <div class="d-flex align-center ga-2 mb-2">
                    <v-icon icon="mdi-timer-outline" size="small" color="primary" />
                    <span class="text-body-2 font-weight-medium">Timing breakdown</span>
                  </div>

                  <div class="timings-grid">
                    <div class="timings-stat">
                      <span class="timings-stat__label">Total</span>
                      <span class="timings-stat__value">{{ formatTiming(props.job.openAi.timings?.totalMs) }}</span>
                    </div>
                    <div class="timings-stat">
                      <span class="timings-stat__label">Transcription</span>
                      <span class="timings-stat__value">{{ formatTiming(props.job.openAi.timings?.transcriptionMs) }}</span>
                    </div>
                    <div class="timings-stat">
                      <span class="timings-stat__label">FFmpeg</span>
                      <span class="timings-stat__value">{{ formatTiming(props.job.openAi.timings?.ffmpegMs) }}</span>
                    </div>
                    <div class="timings-stat">
                      <span class="timings-stat__label">Remaining</span>
                      <span class="timings-stat__value">{{ formatTiming(remainingTiming(props.job.openAi.timings)) }}</span>
                    </div>
                  </div>
                </v-sheet>

                <div
                  v-if="props.job.openAi.videoUrl || props.job.openAi.srtContent"
                  class="mb-4 details-media-layout"
                  :class="{ 'details-media-layout--split': props.job.openAi.videoUrl && props.job.openAi.srtContent }"
                >
                  <div v-if="props.job.openAi.videoUrl" class="details-media-video">
                    <video
                      :src="props.job.openAi.videoUrl"
                      controls
                      preload="metadata"
                      class="details-video"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  <v-sheet v-if="props.job.openAi.srtContent" class="subtitle-panel pa-3" border rounded="lg">
                    <div class="d-flex align-center ga-2 mb-2">
                      <v-icon icon="mdi-subtitles-outline" size="small" color="primary" />
                      <span class="text-body-2 font-weight-medium">Subtitles</span>
                    </div>
                    <pre class="subtitle-content">{{ props.job.openAi.srtContent }}</pre>
                  </v-sheet>
                </div>

                <v-alert
                  v-if="props.job.openAi.status === 'Failed' && props.job.openAi.errorMessage"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ props.job.openAi.errorMessage }}
                </v-alert>

              </v-sheet>
            </v-col>

            <v-col cols="12" md="6">
              <v-sheet class="details-panel pa-5" border rounded="xl">
                <div class="d-flex align-center ga-2 mb-3">
                  <v-icon icon="mdi-google" size="small" color="secondary" />
                  <span class="text-subtitle-2 font-weight-medium">Google Chirp3</span>
                  <v-spacer />
                  <v-chip
                    v-if="providerScore('google') != null"
                    size="small"
                    variant="tonal"
                    color="secondary"
                  >
                    AI score {{ formatScore(providerScore('google')) }}
                  </v-chip>
                  <StatusChip v-if="props.job.googleChirp.status !== 'Completed'" :status="props.job.googleChirp.status" />
                </div>

                <p v-if="summaryText(props.job.googleChirp)" class="text-body-2 text-medium-emphasis mb-3">
                  {{ summaryText(props.job.googleChirp) }}
                </p>

                <v-progress-linear
                  v-if="isProcessing(props.job.googleChirp)"
                  indeterminate
                  color="info"
                  rounded
                  class="mb-4"
                />

                <v-sheet
                  v-if="hasTimings(props.job.googleChirp)"
                  class="timings-panel mb-4 pa-3"
                  border
                  rounded="lg"
                >
                  <div class="d-flex align-center ga-2 mb-2">
                    <v-icon icon="mdi-timer-outline" size="small" color="secondary" />
                    <span class="text-body-2 font-weight-medium">Timing breakdown</span>
                  </div>

                  <div class="timings-grid">
                    <div class="timings-stat">
                      <span class="timings-stat__label">Total</span>
                      <span class="timings-stat__value">{{ formatTiming(props.job.googleChirp.timings?.totalMs) }}</span>
                    </div>
                    <div class="timings-stat">
                      <span class="timings-stat__label">Transcription</span>
                      <span class="timings-stat__value">{{ formatTiming(props.job.googleChirp.timings?.transcriptionMs) }}</span>
                    </div>
                    <div class="timings-stat">
                      <span class="timings-stat__label">FFmpeg</span>
                      <span class="timings-stat__value">{{ formatTiming(props.job.googleChirp.timings?.ffmpegMs) }}</span>
                    </div>
                    <div class="timings-stat">
                      <span class="timings-stat__label">Remaining</span>
                      <span class="timings-stat__value">{{ formatTiming(remainingTiming(props.job.googleChirp.timings)) }}</span>
                    </div>
                  </div>
                </v-sheet>

                <div
                  v-if="props.job.googleChirp.videoUrl || props.job.googleChirp.srtContent"
                  class="mb-4 details-media-layout"
                  :class="{ 'details-media-layout--split': props.job.googleChirp.videoUrl && props.job.googleChirp.srtContent }"
                >
                  <div v-if="props.job.googleChirp.videoUrl" class="details-media-video">
                    <video
                      :src="props.job.googleChirp.videoUrl"
                      controls
                      preload="metadata"
                      class="details-video"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  <v-sheet v-if="props.job.googleChirp.srtContent" class="subtitle-panel pa-3" border rounded="lg">
                    <div class="d-flex align-center ga-2 mb-2">
                      <v-icon icon="mdi-subtitles-outline" size="small" color="secondary" />
                      <span class="text-body-2 font-weight-medium">Subtitles</span>
                    </div>
                    <pre class="subtitle-content">{{ props.job.googleChirp.srtContent }}</pre>
                  </v-sheet>
                </div>

                <v-alert
                  v-if="props.job.googleChirp.status === 'Failed' && props.job.googleChirp.errorMessage"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ props.job.googleChirp.errorMessage }}
                </v-alert>

              </v-sheet>
            </v-col>
          </v-row>

          <v-sheet
            v-if="props.job.evaluation"
            class="evaluation-panel mt-5 pa-4"
            border
            rounded="xl"
          >
            <div class="d-flex align-center ga-2 flex-wrap mb-3">
              <v-icon icon="mdi-chart-box-outline" size="small" color="primary" />
              <span class="text-body-1 font-weight-medium">AI evaluation</span>
              <v-chip
                v-if="props.job.evaluation.status !== 'Completed'"
                size="small"
                variant="tonal"
                :color="evaluationStatusColor(props.job.evaluation.status)"
              >
                {{ evaluationStatusLabel(props.job.evaluation.status) }}
              </v-chip>
              <v-chip
                v-if="props.job.evaluation.status === 'Completed' && props.job.evaluation.winner"
                size="small"
                variant="flat"
                color="success"
              >
                {{ winnerLabel(props.job.evaluation.winner) }}
              </v-chip>
            </div>

            <div v-if="props.job.evaluation.status === 'Evaluating'">
              <p class="evaluation-note mb-3">
                Gemini Flash-Lite is comparing both transcriptions against the original audio.
              </p>
              <v-progress-linear indeterminate color="primary" rounded />
            </div>

            <v-alert
              v-else-if="props.job.evaluation.status === 'Failed' && props.job.evaluation.errorMessage"
              type="error"
              variant="tonal"
            >
              {{ props.job.evaluation.errorMessage }}
            </v-alert>

            <div v-else-if="props.job.evaluation.status === 'Completed'">
              <p v-if="props.job.evaluation.summary" class="evaluation-summary mb-3">
                {{ props.job.evaluation.summary }}
              </p>

              <div class="evaluation-score-grid">
                <div class="evaluation-score-card">
                  <span class="evaluation-score-label">OpenAI score</span>
                  <span class="evaluation-score-value">{{ formatScore(props.job.evaluation.openAiScore) }}</span>
                </div>
                <div class="evaluation-score-card">
                  <span class="evaluation-score-label">Google score</span>
                  <span class="evaluation-score-value">{{ formatScore(props.job.evaluation.googleChirpScore) }}</span>
                </div>
              </div>

              <div class="evaluation-issues-grid mt-3">
                <div class="issues-panel pa-3">
                  <div class="d-flex align-center ga-2 mb-2">
                    <v-icon icon="mdi-robot" size="small" color="primary" />
                    <span class="text-body-2 font-weight-medium">OpenAI issues</span>
                  </div>
                  <ul v-if="providerIssues('openAi').length" class="issues-list">
                    <li v-for="issue in providerIssues('openAi')" :key="`openai-${issue}`">{{ issue }}</li>
                  </ul>
                  <p v-else class="evaluation-note mb-0">No major issues reported.</p>
                </div>

                <div class="issues-panel pa-3">
                  <div class="d-flex align-center ga-2 mb-2">
                    <v-icon icon="mdi-google" size="small" color="secondary" />
                    <span class="text-body-2 font-weight-medium">Google issues</span>
                  </div>
                  <ul v-if="providerIssues('google').length" class="issues-list">
                    <li v-for="issue in providerIssues('google')" :key="`google-${issue}`">{{ issue }}</li>
                  </ul>
                  <p v-else class="evaluation-note mb-0">No major issues reported.</p>
                </div>
              </div>
            </div>

            <p v-else class="evaluation-note mb-0">
              Evaluation starts after both transcription providers finish.
            </p>
          </v-sheet>

          <v-sheet class="comments-panel mt-5 pa-5" border rounded="xl">
            <div class="d-flex align-center ga-2 mb-3">
              <v-icon icon="mdi-comment-text-outline" size="small" color="primary" />
              <span class="text-subtitle-2 font-weight-medium">Human evaluation</span>
              <v-chip size="small" variant="tonal">{{ comments.length }}</v-chip>
            </div>

            <v-alert
              v-if="commentsError"
              type="error"
              variant="tonal"
              class="mb-3"
            >
              {{ commentsError }}
            </v-alert>

            <div class="comments-form mb-4">
              <v-textarea
                v-model="commentText"
                label="Add comment"
                placeholder="Write your evaluation comment"
                variant="outlined"
                density="comfortable"
                rows="3"
                auto-grow
                hide-details="auto"
                :disabled="savingComment"
                class="comments-textarea"
              />

              <div class="comments-form-actions">
                <v-select
                  v-model="commentWinnerTag"
                  :items="winnerTagOptions"
                  item-title="title"
                  item-value="value"
                  label="Winner tag"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :disabled="savingComment"
                  class="comments-winner-select"
                />

                <v-btn
                  color="primary"
                  prepend-icon="mdi-send-outline"
                  :loading="savingComment"
                  :disabled="!commentText.trim()"
                  @click="submitComment"
                >
                  Add comment
                </v-btn>
              </div>
            </div>

            <div v-if="commentsLoading" class="d-flex justify-center py-6">
              <v-progress-circular indeterminate color="primary" size="28" />
            </div>

            <div v-else-if="comments.length === 0" class="comments-empty text-medium-emphasis">
              No comments yet.
            </div>

            <div v-else class="comments-list">
              <v-sheet
                v-for="comment in comments"
                :key="comment.id"
                class="comment-item pa-4"
                border
                rounded="lg"
              >
                <div class="d-flex align-start ga-3">
                  <div class="flex-grow-1" style="min-width: 0">
                    <div class="d-flex align-center ga-2 flex-wrap mb-2">
                      <v-chip
                        size="x-small"
                        variant="tonal"
                        :color="commentWinnerColor(comment.winnerTag)"
                      >
                        {{ commentWinnerLabel(comment.winnerTag) }}
                      </v-chip>
                      <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                    </div>
                    <p class="comment-text mb-0">{{ comment.text }}</p>
                  </div>

                  <v-btn
                    icon="mdi-delete-outline"
                    variant="text"
                    color="error"
                    size="small"
                    :loading="deletingCommentId === comment.id"
                    :disabled="deletingCommentId === comment.id"
                    @click="removeComment(comment.id)"
                  />
                </div>
              </v-sheet>
            </div>
          </v-sheet>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { createComment, deleteComment, getComments } from '@/services/api'
import type {
  CommentWinnerTag,
  EvaluationStatus,
  EvaluationWinner,
  LyricsVideoComment,
  LyricsVideoEvaluation,
  LyricsVideoJob,
  ProviderResult,
  ProviderTimings,
} from '@/types/lyricsVideo'
import StatusChip from './StatusChip.vue'

type ProviderKey = 'openAi' | 'google'

const winnerTagOptions: Array<{ title: string; value: CommentWinnerTag }> = [
  { title: 'OpenAI', value: 'OpenAI' },
  { title: 'Google', value: 'GoogleCloud' },
  { title: 'Both', value: 'Both' },
  { title: 'Not sure', value: 'NotSure' },
  { title: 'None', value: 'None' },
]

const props = defineProps<{
  job: LyricsVideoJob
  deleting?: boolean
}>()

const emit = defineEmits<{
  remove: [jobId: string]
}>()

const detailsOpen = ref(false)
const comments = ref<LyricsVideoComment[]>([])
const commentsLoading = ref(false)
const commentsError = ref<string | null>(null)
const commentText = ref('')
const commentWinnerTag = ref<CommentWinnerTag>('OpenAI')
const savingComment = ref(false)
const deletingCommentId = ref<string | null>(null)
const humanEvaluatedOverride = ref<boolean | null>(null)
const humanWinnerOverride = ref<CommentWinnerTag | null>(null)

const sourceLabel = computed(() => {
  return props.job.sourceType === 'UploadedFile' ? 'File upload' : 'BandLab track'
})

const sourceIcon = computed(() => {
  return props.job.sourceType === 'UploadedFile' ? 'mdi-file-upload-outline' : 'mdi-music-note-outline'
})

const dialogTitle = computed(() => {
  return props.job.metadata?.songName
    || (props.job.sourceType === 'UploadedFile' ? 'Uploaded File' : 'BandLab Track')
})

const effectiveHumanEvaluated = computed(() => {
  return humanEvaluatedOverride.value ?? props.job.humanEvaluated ?? false
})

const effectiveHumanWinner = computed<CommentWinnerTag | null>(() => {
  return humanWinnerOverride.value ?? props.job.humanWinner ?? null
})

async function openDetails() {
  await loadComments()
  detailsOpen.value = true
}

async function loadComments() {
  commentsLoading.value = true
  commentsError.value = null

  try {
    comments.value = await getComments(props.job.id)
    if (!props.job.humanEvaluated && comments.value.length > 0) {
      humanEvaluatedOverride.value = true
      humanWinnerOverride.value = comments.value[0].winnerTag
    }
  } catch (e: any) {
    commentsError.value = e.message || 'Failed to load comments'
  } finally {
    commentsLoading.value = false
  }
}

async function submitComment() {
  if (!commentText.value.trim()) {
    commentsError.value = 'Comment text is required'
    return
  }

  savingComment.value = true
  commentsError.value = null

  try {
    const created = await createComment(props.job.id, {
      text: commentText.value.trim(),
      winnerTag: commentWinnerTag.value,
    })

    comments.value = [created, ...comments.value]
    humanEvaluatedOverride.value = true
    humanWinnerOverride.value = created.winnerTag
    commentText.value = ''
    commentWinnerTag.value = 'OpenAI'
  } catch (e: any) {
    commentsError.value = e.message || 'Failed to create comment'
  } finally {
    savingComment.value = false
  }
}

async function removeComment(commentId: string) {
  deletingCommentId.value = commentId
  commentsError.value = null

  try {
    await deleteComment(commentId)
    comments.value = comments.value.filter(comment => comment.id !== commentId)
  } catch (e: any) {
    commentsError.value = e.message || 'Failed to delete comment'
  } finally {
    deletingCommentId.value = null
  }
}

function isProcessing(result: ProviderResult): boolean {
  return result.status === 'Transcribing' || result.status === 'GeneratingVideo'
}

function hasTimings(result: ProviderResult): boolean {
  return result.timings != null && Object.values(result.timings).some((value) => value != null)
}

function summaryText(result: ProviderResult): string {
  switch (result.status) {
    case 'Pending':
      return 'Queued and waiting to start'
    case 'Transcribing':
      return 'Extracting lyrics and syncing timing'
    case 'GeneratingVideo':
      return 'Rendering the final video output'
    case 'Completed':
      return ''
    case 'Failed':
      return result.errorMessage || 'Generation failed'
    default:
      return ''
  }
}

function evaluationStatusColor(status: EvaluationStatus): string {
  switch (status) {
    case 'Completed':
      return 'success'
    case 'Evaluating':
      return 'info'
    case 'Failed':
      return 'error'
    default:
      return 'warning'
  }
}

function evaluationStatusLabel(status: EvaluationStatus): string {
  switch (status) {
    case 'Evaluating':
      return 'Evaluating'
    case 'Completed':
      return 'Completed'
    case 'Failed':
      return 'Failed'
    default:
      return 'Pending'
  }
}

function winnerLabel(winner: EvaluationWinner): string {
  switch (winner) {
    case 'OpenAI':
      return 'Winner: OpenAI'
    case 'GoogleChirp3':
      return 'Winner: Google'
    case 'Tie':
      return 'Tie'
    default:
      return 'Both weak'
  }
}

function providerScore(provider: ProviderKey): number | null {
  const evaluation = props.job.evaluation
  if (!evaluation || evaluation.status !== 'Completed') {
    return null
  }

  return provider === 'openAi'
    ? evaluation.openAiScore ?? null
    : evaluation.googleChirpScore ?? null
}

function providerIssues(provider: ProviderKey): string[] {
  const evaluation: LyricsVideoEvaluation | null | undefined = props.job.evaluation
  if (!evaluation || evaluation.status !== 'Completed') {
    return []
  }

  return provider === 'openAi'
    ? evaluation.openAiIssues ?? []
    : evaluation.googleChirpIssues ?? []
}

function formatScore(score?: number | null): string {
  return score == null ? '--' : `${score}/10`
}

function formatTiming(value?: number | null): string {
  if (value == null) {
    return '--'
  }

  if (value < 1000) {
    return `${value} ms`
  }

  if (value < 60_000) {
    return `${(value / 1000).toFixed(1)} s`
  }

  const minutes = Math.floor(value / 60_000)
  const seconds = ((value % 60_000) / 1000).toFixed(1)
  return `${minutes}m ${seconds}s`
}

function remainingTiming(timings?: ProviderTimings | null): number | null {
  if (!timings?.totalMs) {
    return null
  }

  const transcription = timings.transcriptionMs ?? 0
  const ffmpeg = timings.ffmpegMs ?? 0
  const remaining = timings.totalMs - transcription - ffmpeg

  return remaining > 0 ? remaining : 0
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function commentWinnerLabel(tag: CommentWinnerTag): string {
  switch (tag) {
    case 'OpenAI':
      return 'OpenAI'
    case 'GoogleCloud':
      return 'Google'
    case 'Both':
      return 'Both'
    case 'NotSure':
      return 'Not sure'
    default:
      return 'None'
  }
}

function commentWinnerColor(tag: CommentWinnerTag): string {
  switch (tag) {
    case 'OpenAI':
      return 'primary'
    case 'GoogleCloud':
      return 'secondary'
    case 'Both':
      return 'success'
    case 'NotSure':
      return 'warning'
    default:
      return 'default'
  }
}
</script>

<style scoped>
.job-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 252, 255, 0.98) 100%),
    rgba(var(--v-theme-surface), 1);
  box-shadow: 0 14px 30px rgba(38, 57, 77, 0.06);
}

.job-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(110px, auto) minmax(120px, auto) auto auto;
  align-items: start;
  gap: 20px;
}

.job-main {
  align-items: flex-start;
}

.job-avatar {
  box-shadow: 0 8px 18px rgba(38, 57, 77, 0.12);
}

.job-source-chip {
  padding-inline: 4px;
  min-height: 24px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 11px;
  line-height: 1.2;
  font-weight: 600;
}

.job-date-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 12px;
  line-height: 1.2;
  font-weight: 500;
}

.job-title {
  font-size: 15px;
  line-height: 1.25;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.92);
}

.job-subline {
  min-height: 18px;
}

.job-creator-line {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.job-creator-name {
  font-size: 13px;
  line-height: 1.25;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.82);
}

.job-submitted-line {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.job-submitted-text {
  font-size: 12px;
  line-height: 1.2;
  font-weight: 500;
}

.job-genre-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  align-self: start;
  min-width: 110px;
}

.job-genre-label {
  font-size: 12px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-weight: 600;
}

.job-genre-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  max-width: 100%;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-secondary), 0.1);
  color: rgba(var(--v-theme-on-surface), 0.8);
  font-size: 12px;
  line-height: 1.2;
  font-weight: 600;
}

.job-genre-pill :deep(.v-icon) {
  opacity: 0.76;
}

.job-human-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  align-self: start;
  min-width: 150px;
}

.job-human-header {
  display: flex;
  align-items: center;
  gap: 4px;
}

.job-human-label {
  font-size: 12px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-weight: 600;
}

.job-human-info {
  color: rgba(var(--v-theme-on-surface), 0.46);
  cursor: help;
}

.job-human-chip {
  max-width: 100%;
}

.job-human-empty {
  font-size: 12px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.42);
  font-weight: 600;
}

.job-statuses {
  justify-content: flex-end;
  gap: 12px;
  align-self: start;
}

.job-status-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 130px;
  padding: 10px 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  background: rgba(var(--v-theme-surface), 0.96);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.job-status-label {
  font-size: 12px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-weight: 600;
}

.job-status-time-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.74);
  font-size: 11px;
  line-height: 1.2;
  font-weight: 600;
}

.job-status-time-pill :deep(.v-icon) {
  opacity: 0.72;
}

.job-status-score-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(var(--v-theme-warning), 0.12);
  color: rgba(var(--v-theme-on-surface), 0.78);
  font-size: 11px;
  line-height: 1.2;
  font-weight: 700;
}

.job-status-score-pill :deep(.v-icon) {
  opacity: 0.8;
}

.job-actions {
  align-items: flex-start;
  align-self: start;
  padding-top: 4px;
}

.job-link-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-size: 12px;
  line-height: 1.2;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 120ms ease, transform 120ms ease;
}

.job-link-pill:hover {
  background: rgba(var(--v-theme-primary), 0.16);
  transform: translateY(-1px);
}

.details-panel {
  height: 100%;
}

.comments-panel {
  background: rgba(var(--v-theme-surface), 0.98);
}

.comments-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comments-form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.comments-textarea {
  width: 100%;
}

.comments-winner-select {
  max-width: 220px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comments-empty {
  font-size: 13px;
  line-height: 1.5;
}

.comment-item {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.comment-date {
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-weight: 500;
}

.comment-text {
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.82);
}

.details-body {
  background: rgba(var(--v-theme-background), 0.55);
}

.evaluation-panel {
  background: rgba(var(--v-theme-surface), 0.98);
}

.evaluation-note {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.evaluation-summary {
  font-size: 13px;
  line-height: 1.55;
  color: rgba(var(--v-theme-on-surface), 0.82);
}

.evaluation-score-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.evaluation-issues-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.evaluation-score-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.evaluation-score-label {
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-weight: 600;
}

.evaluation-score-value {
  font-size: 18px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.9);
  font-weight: 700;
}

.details-provider-row {
  row-gap: 20px;
}

.timings-panel {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.issues-panel {
  background: rgba(var(--v-theme-warning), 0.06);
}

.issues-list {
  margin: 0;
  padding-left: 18px;
  color: rgba(var(--v-theme-on-surface), 0.78);
  font-size: 12px;
  line-height: 1.5;
}

.timings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.timings-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface), 0.92);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.timings-stat__label {
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-weight: 600;
}

.timings-stat__value {
  font-size: 13px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.88);
  font-weight: 700;
}

.details-media-layout {
  --details-video-width: clamp(260px, 24vw, 320px);
  display: grid;
  gap: 16px;
}

.details-media-layout--split {
  grid-template-columns: var(--details-video-width) minmax(0, 1fr);
  align-items: stretch;
}

.details-media-video {
  display: flex;
  justify-content: center;
}

.details-video {
  display: block;
  width: min(100%, var(--details-video-width));
  aspect-ratio: 9 / 16;
  max-height: 68vh;
  margin-inline: auto;
  border-radius: 16px;
  background: #000;
  object-fit: contain;
}

.subtitle-panel {
  display: flex;
  flex-direction: column;
  height: min(68vh, calc(var(--details-video-width) * 16 / 9));
  min-height: 0;
  overflow: hidden;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.subtitle-content {
  white-space: pre-wrap;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.45;
  margin: 0;
}

@media (max-width: 960px) {
  .job-row {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .job-statuses {
    justify-content: flex-start;
  }

  .job-actions {
    padding-top: 0;
  }

  .timings-grid {
    grid-template-columns: 1fr;
  }

  .evaluation-score-grid {
    grid-template-columns: 1fr;
  }

  .evaluation-issues-grid {
    grid-template-columns: 1fr;
  }

  .comments-form-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .comments-winner-select {
    max-width: none;
  }
}
</style>
