<script setup lang="ts">
import { ref } from 'vue'
import Home from './pages/Home.vue'
import ScoreEntry from './pages/ScoreEntry.vue'
import Leaderboard from './pages/Leaderboard.vue'

const currentPage = ref<'home' | 'score' | 'leaderboard'>('home')
const activeRound = ref<any>(null)

function onRoundSelected(round: any) {
  activeRound.value = round
  currentPage.value = 'score'
}
</script>

<template>
  <div class="app">
    <Home v-if="currentPage === 'home'" @round-selected="onRoundSelected" />
    <ScoreEntry v-if="currentPage === 'score'" :round="activeRound" />
    <Leaderboard v-if="currentPage === 'leaderboard'" :round="activeRound" />

    <nav v-if="currentPage !== 'home'" class="tab-bar">
      <button
        :class="{ active: currentPage === 'score' }"
        @pointerdown.prevent="currentPage = 'score'"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        Score
      </button>
      <button
        :class="{ active: currentPage === 'leaderboard' }"
        @pointerdown.prevent="currentPage = 'leaderboard'"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z"/><path d="M12 9h.5a2.5 2.5 0 0 0 0-5C11 4 12 9 12 9z"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/></svg>
        Leaderboard
      </button>
    </nav>
  </div>
</template>

<style>
.app {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
}

.tab-bar {
  display: flex;
  background: var(--bg-surface);
  flex-shrink: 0;
}

.tab-bar button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: color 0.15s;
}

.tab-bar button.active {
  color: var(--accent);
}

.tab-bar button:active {
  color: var(--text-secondary);
}

.tab-bar button svg {
  width: 20px;
  height: 20px;
}
</style>
