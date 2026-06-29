<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getLeaderboard } from '../api'

const props = defineProps<{ round: any }>()

const teams = ref<any[]>([])
const expandedTeamId = ref<number | null>(null)
let interval: ReturnType<typeof setInterval> | null = null

function vsParClass(vsPar: number) {
  if (vsPar < 0) return 'under'
  if (vsPar > 0) return 'over'
  return 'even'
}

function holesPlayed(team: any) {
  return Object.values(team.holes).filter((h: any) => h.strokes > 0).length
}

function formatVsPar(vsPar: number) {
  if (vsPar === 0) return 'E'
  return vsPar > 0 ? `+${vsPar}` : `${vsPar}`
}

async function load() {
  try {
    const data = await getLeaderboard(props.round.id)
    teams.value = data.teams
  } catch (e) {
    console.error('Leaderboard load failed', e)
  }
}

function toggleTeam(id: number) {
  expandedTeamId.value = expandedTeamId.value === id ? null : id
}

onMounted(() => {
  load()
  interval = setInterval(load, 10000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div class="leaderboard">
    <div class="header">
      <h2>Leaderboard</h2>
      <span class="live-badge">● LIVE</span>
    </div>

    <div class="round-name">{{ round.name }}</div>

    <div class="cards">
      <div v-for="(team, idx) in teams" :key="team.id" class="team-card" @click="toggleTeam(team.id)">
        <div class="team-row">
          <span class="position">{{ idx + 1 }}</span>
          <img
            :src="`/avatars/${team.name.toLowerCase()}.jpg`"
            class="team-avatar"
            @error="($event.target as HTMLImageElement).style.display='none'"
          />
          <div class="team-info">
            <span class="team-name">{{ team.name }}</span>
            <div class="player-lines" v-if="team.players">
              <span v-for="p in team.players" :key="p.id" class="player-line">
                <img
                  :src="`/avatars/${p.name.toLowerCase()}.jpg`"
                  class="mini-avatar"
                  @error="($event.target as HTMLImageElement).style.display='none'"
                />
                <span>{{ p.name }}</span>
                <span class="player-line-score">{{ p.total }}</span>
                <span class="player-line-vspar" :class="vsParClass(p.vsPar)">{{ formatVsPar(p.vsPar) }}</span>
              </span>
            </div>
            <span class="team-thru">Thru {{ holesPlayed(team) || '-' }} holes &middot; Round {{ formatVsPar(team.roundVsPar) }}</span>
          </div>
          <div class="total-column">
            <span class="team-total">{{ team.total }}</span>
            <span class="team-vs-par" :class="vsParClass(team.roundVsPar)">{{ formatVsPar(team.roundVsPar) }}</span>
          </div>
        </div>

        <div v-if="expandedTeamId === team.id" class="breakdown">
          <div class="breakdown-row">
            <span class="bd-label">Hole</span>
            <span v-for="h in 18" :key="h" class="bd-cell dim">{{ h }}</span>
          </div>
          <div class="breakdown-row">
            <span class="bd-label">Par</span>
            <span v-for="h in 18" :key="h" class="bd-cell dim">{{ team.holes[h]?.par || '-' }}</span>
          </div>
          <div v-for="p in team.players" :key="p.id" class="breakdown-row">
            <span class="bd-label player-label">
              <img
                :src="`/avatars/${p.name.toLowerCase()}.jpg`"
                class="bd-avatar"
                @error="($event.target as HTMLImageElement).style.display='none'"
              />
              {{ p.name }}
            </span>
            <span
              v-for="h in 18" :key="h"
              class="bd-cell score"
              :class="p.holes[h]?.strokes > 0 ? vsParClass(p.holes[h].vsPar) : ''"
            >
              {{ p.holes[h]?.strokes || '-' }}
            </span>
          </div>
          <div class="breakdown-row team-row-bd">
            <span class="bd-label team-label">Team</span>
            <span
              v-for="h in 18" :key="h"
              class="bd-cell score"
              :class="team.holes[h]?.strokes > 0 ? vsParClass(team.holes[h].vsPar) : ''"
            >
              {{ team.holes[h]?.strokes || '-' }}
            </span>
          </div>
          <div class="breakdown-row total-row-bd">
            <span class="bd-label">Total</span>
            <span v-for="h in 18" :key="h" class="bd-cell total">{{ team.holes[h]?.roundTotal || '-' }}</span>
          </div>
        </div>
      </div>

      <div v-if="teams.length === 0" class="empty">
        <p>No scores yet.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaderboard {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow-y: auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.header h2 {
  font-size: 20px;
  font-weight: 800;
}

.live-badge {
  font-size: 12px;
  font-weight: 700;
  color: var(--green);
}

.round-name {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.team-card {
  background: var(--bg-card);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.team-card:active {
  background: var(--bg-elevated);
}

.team-row {
  display: flex;
  align-items: center;
  padding: 14px;
  gap: 10px;
  min-height: 48px;
}

.position {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
  background: var(--text-muted);
  color: white;
}

.position:nth-child(1) {
  background: var(--gold);
  color: #0b0b12;
}

.team-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.team-info {
  flex: 1;
}

.team-name {
  font-size: 16px;
  font-weight: 700;
  display: block;
}

.player-lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 4px 0 2px;
}

.player-line {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.player-line-score {
  margin-left: auto;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 20px;
  text-align: right;
  color: var(--text-primary);
}

.player-line-vspar {
  font-size: 11px;
  font-weight: 600;
  min-width: 22px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.player-line-vspar.under { color: var(--green); }
.player-line-vspar.over { color: var(--red); }
.player-line-vspar.even { color: var(--text-muted); }

.mini-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.team-thru {
  font-size: 12px;
  color: var(--text-muted);
}

.total-column {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.team-total {
  font-size: 20px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--text-primary);
}

.team-vs-par {
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.team-vs-par.under { color: var(--green); }
.team-vs-par.over { color: var(--red); }
.team-vs-par.even { color: var(--text-muted); }

.breakdown {
  padding: 12px 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.breakdown-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-bottom: 4px;
}

.bd-label {
  min-width: 72px;
  color: var(--text-muted);
  font-weight: 600;
  flex-shrink: 0;
}

.bd-cell {
  min-width: 24px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.bd-cell.dim { color: var(--text-muted); }
.bd-cell.total { color: var(--text-secondary); }

.bd-cell.score { font-weight: 600; }
.bd-cell.score.under { color: var(--green); }
.bd-cell.score.over { color: var(--red); }
.bd-cell.score.even { color: var(--text-primary); }

.bd-cell.score { font-weight: 500; }
.team-row-bd .bd-cell.score { font-weight: 700; }
.total-row-bd .bd-cell.total { font-weight: 700; color: var(--text-primary); }
.player-label { font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; min-width: 72px; }
.team-label { font-size: 11px; color: var(--text-primary); font-weight: 700; }
.bd-avatar { width: 16px; height: 16px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 48px 0;
}
</style>
