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
          <span class="text-truncate">{{ effectiveGenreName || '--' }}</span>
        </div>
      </div>

      <div class="job-statuses d-flex align-center ga-2 flex-wrap">
        <div class="job-status-card">
          <span class="job-status-label">OpenAI</span>
          <StatusChip :status="props.job.openAi.status" />
          <div v-if="providerScore('openAi') != null" class="job-status-score-pill">
            <v-icon icon="mdi-star-four-points-outline" size="x-small" />
            <span>{{ formatScore(providerScore('openAi')) }}</span>
          </div>
          <v-chip
            size="x-small"
            variant="tonal"
            :color="providerReview('openAi') ? reviewStatusColor(providerReview('openAi')!.status) : 'grey-darken-1'"
            :prepend-icon="reviewStatusIcon(providerReview('openAi')?.status)"
            class="job-status-review-chip"
          >
            {{ providerReview('openAi') ? `${reviewStatusLabel(providerReview('openAi')!.status)} by Human` : 'Not reviewed' }}
          </v-chip>
        </div>
        <div class="job-status-card">
          <span class="job-status-label">Google</span>
          <StatusChip :status="props.job.googleChirp.status" />
          <div v-if="providerScore('google') != null" class="job-status-score-pill">
            <v-icon icon="mdi-star-four-points-outline" size="x-small" />
            <span>{{ formatScore(providerScore('google')) }}</span>
          </div>
          <v-chip
            size="x-small"
            variant="tonal"
            :color="providerReview('google') ? reviewStatusColor(providerReview('google')!.status) : 'grey-darken-1'"
            :prepend-icon="reviewStatusIcon(providerReview('google')?.status)"
            class="job-status-review-chip"
          >
            {{ providerReview('google') ? `${reviewStatusLabel(providerReview('google')!.status)} by Human` : 'Not reviewed' }}
          </v-chip>
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
          <v-sheet
            v-if="props.job.evaluation"
            class="evaluation-panel mb-5 pa-4"
            border
            rounded="xl"
          >
            <div class="details-section-header details-section-header--evaluation d-flex align-center ga-2 flex-wrap mb-4">
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

          <v-sheet class="genre-editor-panel mb-5 pa-4" border rounded="xl">
            <div class="d-flex align-center ga-2 mb-3">
              <v-icon icon="mdi-shape-outline" size="small" color="primary" />
              <span class="text-body-1 font-weight-medium">Genre</span>
            </div>

            <p class="evaluation-note mb-3">
              Update genre in case it is not matching the actual audio.
            </p>

            <v-alert
              v-if="genreError"
              type="error"
              variant="tonal"
              class="mb-3"
            >
              {{ genreError }}
            </v-alert>

            <div class="genre-editor-controls">
              <v-select
                v-model="selectedGenreSlug"
                :items="genreOptions"
                item-title="title"
                item-value="value"
                label="Genre"
                variant="outlined"
                density="comfortable"
                hide-details
                :disabled="savingGenre"
                class="genre-editor-select"
              />

              <v-btn
                color="primary"
                prepend-icon="mdi-content-save-outline"
                :loading="savingGenre"
                :disabled="!selectedGenreSlug || !hasGenreChanged"
                @click="saveGenre"
              >
                Update genre
              </v-btn>
            </div>
          </v-sheet>

          <v-row class="details-provider-row" dense>
            <v-col cols="12" md="6">
              <v-sheet class="details-panel pa-5" border rounded="xl">
                <div class="details-section-header details-section-header--openai d-flex align-center ga-2 mb-4">
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
                    <span class="text-body-2 font-weight-medium">How long it took to generate video</span>
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
                      <span class="timings-stat__label">Video rendering</span>
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

                <v-sheet class="provider-review-panel pa-4" border rounded="lg">
                  <div class="d-flex align-center ga-2 mb-3">
                    <v-icon icon="mdi-thumb-up-down-outline" size="small" color="primary" />
                    <span class="text-body-2 font-weight-medium">Current review</span>
                    <v-chip
                      v-if="providerReview('openAi')"
                      size="x-small"
                      variant="tonal"
                      :color="reviewStatusColor(providerReview('openAi')!.status)"
                      :prepend-icon="reviewStatusIcon(providerReview('openAi')!.status)"
                    >
                      {{ reviewStatusLabel(providerReview('openAi')!.status) }}
                    </v-chip>
                  </div>

                  <v-alert
                    v-if="reviewError('openAi')"
                    type="error"
                    variant="tonal"
                    class="mb-3"
                  >
                    {{ reviewError('openAi') }}
                  </v-alert>

                  <p v-if="!canReview('openAi')" class="review-note mb-0">
                    Human review becomes available after the video is ready.
                  </p>

                  <div v-else class="review-form">
                    <v-select
                      v-model="openAiReviewStatus"
                      :items="reviewStatusOptions"
                      item-title="title"
                      item-value="value"
                      label="Status"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      :disabled="isSavingReview('openAi') || isClearingReview('openAi')"
                      class="review-status-select"
                    >
                      <template #item="{ props: itemProps, item }">
                        <v-list-item
                          v-bind="itemProps"
                          :prepend-icon="item.raw.icon"
                          :title="item.raw.title"
                        />
                      </template>

                      <template #selection="{ item }">
                        <div class="d-flex align-center ga-2">
                          <v-icon size="small" :icon="item.raw.icon" />
                          <span>{{ item.raw.title }}</span>
                        </div>
                      </template>
                    </v-select>

                    <v-textarea
                      v-model="openAiReviewText"
                      label="Optional note"
                      placeholder="Add context if needed"
                      variant="outlined"
                      density="comfortable"
                      rows="3"
                      auto-grow
                      hide-details="auto"
                      :disabled="isSavingReview('openAi') || isClearingReview('openAi')"
                      class="review-textarea"
                    />

                    <div class="review-form-actions">
                      <div v-if="providerReview('openAi')" class="review-meta d-flex align-center ga-2 flex-wrap">
                        <span class="review-date">Last saved {{ formatDate(providerReview('openAi')!.createdAt) }}</span>
                      </div>

                      <div class="review-form-buttons">
                        <v-btn
                          v-if="providerReview('openAi')"
                          variant="text"
                          color="error"
                          prepend-icon="mdi-delete-outline"
                          :loading="isClearingReview('openAi')"
                          :disabled="isSavingReview('openAi')"
                          @click="clearReview('openAi')"
                        >
                          Clear human review
                        </v-btn>

                        <v-btn
                          color="primary"
                          prepend-icon="mdi-content-save-outline"
                          :loading="isSavingReview('openAi')"
                          :disabled="isClearingReview('openAi')"
                          @click="saveReview('openAi')"
                        >
                          {{ providerReview('openAi') ? 'Update human review' : 'Save human review' }}
                        </v-btn>
                      </div>
                    </div>
                  </div>
                </v-sheet>

              </v-sheet>
            </v-col>

            <v-col cols="12" md="6">
              <v-sheet class="details-panel pa-5" border rounded="xl">
                <div class="details-section-header details-section-header--google d-flex align-center ga-2 mb-4">
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
                    <span class="text-body-2 font-weight-medium">How long it took to generate video</span>
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
                      <span class="timings-stat__label">Video rendering</span>
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

                <v-sheet class="provider-review-panel pa-4" border rounded="lg">
                  <div class="d-flex align-center ga-2 mb-3">
                    <v-icon icon="mdi-thumb-up-down-outline" size="small" color="secondary" />
                    <span class="text-body-2 font-weight-medium">Current review</span>
                    <v-chip
                      v-if="providerReview('google')"
                      size="x-small"
                      variant="tonal"
                      :color="reviewStatusColor(providerReview('google')!.status)"
                      :prepend-icon="reviewStatusIcon(providerReview('google')!.status)"
                    >
                      {{ reviewStatusLabel(providerReview('google')!.status) }}
                    </v-chip>
                  </div>

                  <v-alert
                    v-if="reviewError('google')"
                    type="error"
                    variant="tonal"
                    class="mb-3"
                  >
                    {{ reviewError('google') }}
                  </v-alert>

                  <p v-if="!canReview('google')" class="review-note mb-0">
                    Human review becomes available after the video is ready.
                  </p>

                  <div v-else class="review-form">
                    <v-select
                      v-model="googleReviewStatus"
                      :items="reviewStatusOptions"
                      item-title="title"
                      item-value="value"
                      label="Status"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                      :disabled="isSavingReview('google') || isClearingReview('google')"
                      class="review-status-select"
                    >
                      <template #item="{ props: itemProps, item }">
                        <v-list-item
                          v-bind="itemProps"
                          :prepend-icon="item.raw.icon"
                          :title="item.raw.title"
                        />
                      </template>

                      <template #selection="{ item }">
                        <div class="d-flex align-center ga-2">
                          <v-icon size="small" :icon="item.raw.icon" />
                          <span>{{ item.raw.title }}</span>
                        </div>
                      </template>
                    </v-select>

                    <v-textarea
                      v-model="googleReviewText"
                      label="Optional note"
                      placeholder="Add context if needed"
                      variant="outlined"
                      density="comfortable"
                      rows="3"
                      auto-grow
                      hide-details="auto"
                      :disabled="isSavingReview('google') || isClearingReview('google')"
                      class="review-textarea"
                    />

                    <div class="review-form-actions">
                      <div v-if="providerReview('google')" class="review-meta d-flex align-center ga-2 flex-wrap">
                        <span class="review-date">Last saved {{ formatDate(providerReview('google')!.createdAt) }}</span>
                      </div>

                      <div class="review-form-buttons">
                        <v-btn
                          v-if="providerReview('google')"
                          variant="text"
                          color="error"
                          prepend-icon="mdi-delete-outline"
                          :loading="isClearingReview('google')"
                          :disabled="isSavingReview('google')"
                          @click="clearReview('google')"
                        >
                          Clear human review
                        </v-btn>

                        <v-btn
                          color="primary"
                          prepend-icon="mdi-content-save-outline"
                          :loading="isSavingReview('google')"
                          :disabled="isClearingReview('google')"
                          @click="saveReview('google')"
                        >
                          {{ providerReview('google') ? 'Update human review' : 'Save human review' }}
                        </v-btn>
                      </div>
                    </div>
                  </div>
                </v-sheet>

              </v-sheet>
            </v-col>
          </v-row>

        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { clearProviderReview, setProviderReview, updateGenre } from '@/services/api'
import type {
  EvaluationStatus,
  EvaluationWinner,
  LyricsVideoJob,
  LyricsVideoEvaluation,
  LyricsVideoProviderReview,
  ProviderReviewStatus,
  ProviderResult,
  ProviderTimings,
} from '@/types/lyricsVideo'
import StatusChip from './StatusChip.vue'

type ProviderKey = 'openAi' | 'google'
type ReviewEndpoint = 'openai' | 'google-cloud'
type GenreMetadata = { genreSlug?: string | null; genreName?: string | null }

const genreOptions: Array<{ title: string; value: string }> = [
  { title: 'Rock', value: 'rock' },
  { title: 'Pop', value: 'pop' },
  { title: 'Hip Hop', value: 'hip-hop' },
  { title: 'R&B & Soul', value: 'r-n-b' },
  { title: 'Electronic', value: 'electronic' },
  { title: 'Jazz', value: 'jazz' },
  { title: 'Folk', value: 'folk' },
  { title: 'Latin', value: 'latin' },
  { title: 'Classical', value: 'classical' },
  { title: 'Funk', value: 'funk' },
  { title: 'Blues', value: 'blues' },
  { title: 'Other', value: 'other' },
  { title: 'Metal', value: 'metal' },
  { title: 'Country', value: 'country' },
  { title: 'Reggae', value: 'reggae' },
  { title: 'Christian & Gospel', value: 'christian-and-gospel' },
  { title: 'K-Pop', value: 'k-pop' },
  { title: 'Progresive Rock', value: 'progressive-rock' },
  { title: 'Afro', value: 'afro' },
  { title: 'House', value: 'house' },
  { title: 'Dance & EDM', value: 'dance-and-edm' },
  { title: 'Trap', value: 'trap' },
  { title: 'Punk', value: 'punk' },
  { title: 'Lofi', value: 'lofi' },
  { title: 'Dancehall', value: 'dancehall' },
]

const reviewStatusOptions: Array<{ title: string; value: ProviderReviewStatus; icon: string }> = [
  { title: 'Approved', value: 'Approved', icon: 'mdi-check-circle-outline' },
  { title: 'Rejected', value: 'Rejected', icon: 'mdi-close-circle-outline' },
  { title: 'Not sure', value: 'NotSure', icon: 'mdi-help-circle-outline' },
]

const props = defineProps<{
  job: LyricsVideoJob
  deleting?: boolean
}>()

const emit = defineEmits<{
  remove: [jobId: string]
  genreUpdated: [payload: { jobId: string; genreSlug: string; genreName: string }]
  reviewUpdated: [payload: { jobId: string; provider: 'openAi' | 'google'; review: LyricsVideoProviderReview | null }]
}>()

const detailsOpen = ref(false)
const openAiReviewStatus = ref<ProviderReviewStatus>('Approved')
const openAiReviewText = ref('')
const googleReviewStatus = ref<ProviderReviewStatus>('Approved')
const googleReviewText = ref('')
const openAiReviewError = ref<string | null>(null)
const googleReviewError = ref<string | null>(null)
const savingReviewProvider = ref<ProviderKey | null>(null)
const clearingReviewProvider = ref<ProviderKey | null>(null)
const openAiReviewOverride = ref<LyricsVideoProviderReview | null | undefined>(undefined)
const googleReviewOverride = ref<LyricsVideoProviderReview | null | undefined>(undefined)
const selectedGenreSlug = ref('')
const genreError = ref<string | null>(null)
const savingGenre = ref(false)
const genreOverride = ref<GenreMetadata | undefined>(undefined)

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

const effectiveGenreSlug = computed(() => {
  return genreOverride.value === undefined
    ? props.job.metadata?.genreSlug ?? null
    : genreOverride.value.genreSlug ?? null
})

const effectiveGenreName = computed(() => {
  return genreOverride.value === undefined
    ? props.job.metadata?.genreName ?? null
    : genreOverride.value.genreName ?? null
})

const hasGenreChanged = computed(() => {
  return selectedGenreSlug.value !== (effectiveGenreSlug.value ?? '')
})

function openDetails() {
  syncReviewForms()
  syncGenreForm()
  detailsOpen.value = true
}

function syncGenreForm() {
  selectedGenreSlug.value = effectiveGenreSlug.value ?? ''
  genreError.value = null
}

function syncReviewForms() {
  const openAiReview = providerReview('openAi')
  openAiReviewStatus.value = openAiReview?.status ?? 'Approved'
  openAiReviewText.value = openAiReview?.text ?? ''
  openAiReviewError.value = null

  const googleReview = providerReview('google')
  googleReviewStatus.value = googleReview?.status ?? 'Approved'
  googleReviewText.value = googleReview?.text ?? ''
  googleReviewError.value = null
}

function reviewEndpoint(provider: ProviderKey): ReviewEndpoint {
  return provider === 'openAi' ? 'openai' : 'google-cloud'
}

function providerReview(provider: ProviderKey): LyricsVideoProviderReview | null {
  if (provider === 'openAi') {
    return openAiReviewOverride.value === undefined
      ? props.job.openAiApproval ?? null
      : openAiReviewOverride.value
  }

  return googleReviewOverride.value === undefined
    ? props.job.googleCloudApproval ?? null
    : googleReviewOverride.value
}

function providerResult(provider: ProviderKey): ProviderResult {
  return provider === 'openAi' ? props.job.openAi : props.job.googleChirp
}

function reviewError(provider: ProviderKey): string | null {
  return provider === 'openAi' ? openAiReviewError.value : googleReviewError.value
}

function isSavingReview(provider: ProviderKey): boolean {
  return savingReviewProvider.value === provider
}

function isClearingReview(provider: ProviderKey): boolean {
  return clearingReviewProvider.value === provider
}

function canReview(provider: ProviderKey): boolean {
  return providerResult(provider).status === 'Completed'
}

async function saveReview(provider: ProviderKey) {
  const text = provider === 'openAi'
    ? openAiReviewText.value.trim()
    : googleReviewText.value.trim()
  const status = provider === 'openAi'
    ? openAiReviewStatus.value
    : googleReviewStatus.value

  if (provider === 'openAi') {
    openAiReviewError.value = null
  } else {
    googleReviewError.value = null
  }

  savingReviewProvider.value = provider

  try {
    const savedReview = await setProviderReview(props.job.id, reviewEndpoint(provider), {
      status,
      ...(text ? { text } : {}),
    })

    if (provider === 'openAi') {
      openAiReviewOverride.value = savedReview
      openAiReviewStatus.value = savedReview.status
      openAiReviewText.value = savedReview.text ?? ''
    } else {
      googleReviewOverride.value = savedReview
      googleReviewStatus.value = savedReview.status
      googleReviewText.value = savedReview.text ?? ''
    }

    emit('reviewUpdated', {
      jobId: props.job.id,
      provider,
      review: savedReview,
    })
  } catch (e: any) {
    const message = e.message || 'Failed to save review'
    if (provider === 'openAi') {
      openAiReviewError.value = message
    } else {
      googleReviewError.value = message
    }
  } finally {
    savingReviewProvider.value = null
  }
}

async function clearReview(provider: ProviderKey) {
  if (provider === 'openAi') {
    openAiReviewError.value = null
  } else {
    googleReviewError.value = null
  }

  clearingReviewProvider.value = provider

  try {
    await clearProviderReview(props.job.id, reviewEndpoint(provider))

    if (provider === 'openAi') {
      openAiReviewOverride.value = null
      openAiReviewStatus.value = 'Approved'
      openAiReviewText.value = ''
    } else {
      googleReviewOverride.value = null
      googleReviewStatus.value = 'Approved'
      googleReviewText.value = ''
    }

    emit('reviewUpdated', {
      jobId: props.job.id,
      provider,
      review: null,
    })
  } catch (e: any) {
    const message = e.message || 'Failed to clear review'
    if (provider === 'openAi') {
      openAiReviewError.value = message
    } else {
      googleReviewError.value = message
    }
  } finally {
    clearingReviewProvider.value = null
  }
}

async function saveGenre() {
  if (!selectedGenreSlug.value) {
    genreError.value = 'Genre is required'
    return
  }

  savingGenre.value = true
  genreError.value = null

  try {
    const updatedGenre = await updateGenre(props.job.id, {
      genreSlug: selectedGenreSlug.value,
    })

    genreOverride.value = updatedGenre
    selectedGenreSlug.value = updatedGenre.genreSlug
    emit('genreUpdated', {
      jobId: props.job.id,
      genreSlug: updatedGenre.genreSlug,
      genreName: updatedGenre.genreName,
    })
  } catch (e: any) {
    genreError.value = e.message || 'Failed to update genre'
  } finally {
    savingGenre.value = false
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

function reviewStatusLabel(status: ProviderReviewStatus): string {
  switch (status) {
    case 'Approved':
      return 'Approved'
    case 'Rejected':
      return 'Rejected'
    default:
      return 'Not sure'
  }
}

function reviewStatusColor(status: ProviderReviewStatus): string {
  switch (status) {
    case 'Approved':
      return 'success'
    case 'Rejected':
      return 'error'
    default:
      return 'warning'
  }
}

function reviewStatusIcon(status?: ProviderReviewStatus | null): string {
  switch (status) {
    case 'Approved':
      return 'mdi-check-circle-outline'
    case 'Rejected':
      return 'mdi-close-circle-outline'
    case 'NotSure':
      return 'mdi-help-circle-outline'
    default:
      return 'mdi-account-clock-outline'
  }
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
  grid-template-columns: minmax(0, 1fr) minmax(110px, auto) auto auto;
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

.job-status-review-chip {
  max-width: 100%;
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

.details-panel,
.evaluation-panel {
  background: rgba(var(--v-theme-surface), 0.985);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 14px 30px rgba(38, 57, 77, 0.08);
}

.details-panel {
  height: 100%;
}

.details-section-header {
  min-height: 46px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-surface), 0.64);
  backdrop-filter: blur(4px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.68);
}

.details-section-header--openai {
  background: linear-gradient(180deg, rgba(var(--v-theme-primary), 0.2) 0%, rgba(var(--v-theme-primary), 0.1) 100%);
  border-color: rgba(var(--v-theme-primary), 0.24);
  box-shadow:
    inset 0 3px 0 rgba(var(--v-theme-primary), 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.details-section-header--google {
  background: linear-gradient(180deg, rgba(var(--v-theme-primary), 0.2) 0%, rgba(var(--v-theme-primary), 0.1) 100%);
  border-color: rgba(var(--v-theme-primary), 0.24);
  box-shadow:
    inset 0 3px 0 rgba(var(--v-theme-primary), 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.details-section-header--evaluation {
  background: linear-gradient(180deg, rgba(var(--v-theme-warning), 0.22) 0%, rgba(var(--v-theme-warning), 0.11) 100%);
  border-color: rgba(var(--v-theme-warning), 0.26);
  box-shadow:
    inset 0 3px 0 rgba(var(--v-theme-warning), 0.52),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.provider-review-panel {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.review-form-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.review-textarea {
  width: 100%;
}

.review-status-select {
  max-width: 220px;
}

.review-meta {
  min-height: 24px;
}

.review-date {
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-weight: 500;
}

.genre-editor-panel {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.genre-editor-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.genre-editor-select {
  flex: 1 1 260px;
  min-width: 240px;
  max-width: 360px;
}

.details-body {
  background: rgba(var(--v-theme-background), 0.55);
}

.review-note {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.7);
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
  row-gap: 24px;
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
  --details-video-width: clamp(208px, 19vw, 266px);
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

  .review-form-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .review-form-buttons {
    justify-content: stretch;
  }

  .review-status-select {
    max-width: none;
  }

  .genre-editor-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .genre-editor-select {
    min-width: 0;
    max-width: none;
    width: 100%;
  }
}
</style>
