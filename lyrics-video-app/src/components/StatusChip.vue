<template>
  <v-chip :color="color" :prepend-icon="icon" size="small" variant="tonal" label>
    <template v-if="isProcessing">
      <v-progress-circular
        indeterminate
        size="12"
        width="2"
        class="mr-1"
      />
    </template>
    {{ label }}
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LyricsVideoStatus } from '@/types/lyricsVideo'

const props = defineProps<{
  status: LyricsVideoStatus
}>()

const PROCESSING_STATUSES: LyricsVideoStatus[] = [
  'Downloading',
  'Transcribing',
  'GeneratingVideo',
  'Uploading',
]

const isProcessing = computed(() => PROCESSING_STATUSES.includes(props.status))

const color = computed(() => {
  switch (props.status) {
    case 'Completed': return 'success'
    case 'Failed': return 'error'
    case 'Pending': return 'grey'
    default: return 'info'
  }
})

const icon = computed(() => {
  switch (props.status) {
    case 'Completed': return 'mdi-check-circle'
    case 'Failed': return 'mdi-alert-circle'
    case 'Pending': return 'mdi-clock-outline'
    case 'Downloading': return 'mdi-download'
    case 'Transcribing': return 'mdi-text-recognition'
    case 'GeneratingVideo': return 'mdi-movie-open'
    case 'Uploading': return 'mdi-upload'
    default: return 'mdi-help-circle'
  }
})

const label = computed(() => {
  switch (props.status) {
    case 'GeneratingVideo': return 'Generating Video'
    default: return props.status
  }
})
</script>
