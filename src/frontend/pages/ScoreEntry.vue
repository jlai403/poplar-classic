<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getPlayers, getScores, getCourse, upsertScore } from '../api'

const props = defineProps<{ round: any }>()

const players = ref<Array<{ id: number; name: string; teamId: number; teamName: string }>>([])
const scores = ref<Record<string, number>>({})
const currentHole = ref(1)
const coursePar = ref<number[]>([])
const loading = ref(true)

const TEAM_ORDER = ['Showie', 'Dan', 'Smott']

const teamGroups = computed(() => {
  const map = new Map<string, { name: string; players: typeof players.value }>()
  for (const p of players.value) {
    if (!map.has(p.teamName)) {
      map.set(p.teamName, { name: p.teamName, players: [] })
    }
    map.get(p.teamName)!.players.push(p)
  }
  return TEAM_ORDER.map(name => map.get(name)).filter(Boolean) as Array<{ name: string; players: typeof players.value }>
})

const STARTING_TOTALS: Record<string, number> = { Showie: 138, Dan: 147, Smott: 142 }

const teamTotals = computed(() => {
  return teamGroups.value.map(team => {
    let roundTotal = 0
    for (let h = 1; h <= 18; h++) {
      for (const p of team.players) {
        roundTotal += scores.value[`${p.id}-${h}`] || 0
      }
    }
    const starting = STARTING_TOTALS[team.name] ?? 0
    return { name: team.name, roundTotal, grandTotal: starting + roundTotal }
  })
})

const currentPar = computed(() => coursePar.value[currentHole.value - 1] ?? 4)

const prevHoleScores = computed(() => {
  if (currentHole.value <= 1) return null
  const hole = currentHole.value - 1
  const par = coursePar.value[hole - 1] ?? 4
  return players.value.map(p => ({
    ...p,
    strokes: scores.value[`${p.id}-${hole}`] || 0,
    vsPar: (scores.value[`${p.id}-${hole}`] || 0) - par,
  }))
})

const currentSmack = computed(() => {
  const data = prevHoleScores.value
  if (!data) return null

  const played = data.filter(s => s.strokes > 0)
  if (played.length === 0) return null

  const par = coursePar.value[currentHole.value - 2] ?? 4
  const ranked = [...played].sort((a, b) => b.strokes - a.strokes)
  const worst = ranked[0]

  const teamTotals = Object.entries(
    played.reduce((acc, s) => {
      acc[s.teamName] = (acc[s.teamName] || 0) + s.strokes
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])
  const worstTeam = teamTotals[0]
  const bestTeam = teamTotals[teamTotals.length - 1]

  const worstVsPar = worst.strokes - par
  const worstTeamVsPar = worstTeam[1] - par * 2

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
  const worstUnderPar = played.filter(s => s.strokes < par)

  if (worstVsPar >= 4) {
    return { text: pick([
      `${worst.name} carded a ${worst.strokes} on a par ${par}. The handicap is filing for divorce.`,
      `${worst.name} took ${worst.strokes} on a par ${par}. That is ${worstVsPar} over. The math is mathing.`,
      `${worst.name} with a ${worst.strokes}. The course rating did not account for this.`,
      `${worst.name} went ${worst.strokes}. That's a snowman. Don't frame that scorecard.`,
      `${worst.name} dropped a ${worst.strokes}. Negative strokes gained on that hole. Impressive.`,
    ]), emoji: "🏛️" }
  }
  if (worstVsPar >= 3) {
    return { text: pick([
      `${worst.name} with a ${worst.strokes}. Triple bogey territory. The handicap is watching.`,
      `${worst.name} took ${worst.strokes} on a par ${par}. That's ${worstVsPar} over. Routine stuff.`,
      `${worst.name} went ${worst.strokes}. The rest of the group is now adjusting their expectations.`,
      `${worst.name} with a ${worst.strokes}. That hole had a 0.0% chance of happening. It happened.`,
    ]), emoji: "🧭" }
  }
  if (worstVsPar >= 2) {
    return { text: pick([
      `${worst.name} with a ${worst.strokes}. Double. Routine maintenance.`,
      `${worst.name} went ${worst.strokes} on a par ${par}. The math works out to ${worstVsPar} over. It does not look good.`,
      `${worst.name} dropped a ${worst.strokes}. That is net bogey golf. At best.`,
    ]), emoji: "📉" }
  }
  if (worstVsPar >= 1) {
    return { text: pick([
      `${worst.name} with a ${worst.strokes}. Bogey. The course wins that hole.`,
      `${worst.name} went ${worst.strokes}. ${worstVsPar} over. The architect is vindicated.`,
      `${worst.name} bogeyed. The definition of par plus one. Which is ${worst.strokes}.`,
      `${worst.name} dropped a ${worst.strokes}. Slightly worse than average. Which is par.`,
    ]), emoji: "💼" }
  }

  if (worstUnderPar.length >= 2) {
    return { text: pick([
      `${worstUnderPar.map(s => s.name).join(' & ')} under par. You love to see it. They love to tell you about it.`,
      `${worstUnderPar.map(s => s.name).join(' & ')} with a combined ${worstUnderPar.reduce((a, s) => a + s.strokes, 0)}. The math is mathing. In their favor.`,
      `${worstUnderPar.map(s => s.name).join(' & ')} under par. The rest of the group is taking notes.`,
    ]), emoji: "🔍" }
  }
  if (worstUnderPar.length === 1) {
    return { text: pick([
      `${worstUnderPar[0].name} with a ${worstUnderPar[0].strokes}. ${worstUnderPar[0].strokes < par ? 'Birdie. Rare air.' : 'Par. Acceptable.'}`,
      `${worstUnderPar[0].name} went ${worstUnderPar[0].strokes}. The handicap is confused.`,
      `${worstUnderPar[0].name} under par. The golf gods are distracted. Enjoy it while it lasts.`,
    ]), emoji: "🎯" }
  }

  if (worstTeamVsPar >= 4) {
    return { text: pick([
      `Team ${worstTeam[0]} combining for ${worstTeam[1]}. That is ${worstTeamVsPar} over. Two great minds, one terrible score.`,
      `Team ${worstTeam[0]} with ${worstTeam[1]}. The math says that is ${worstTeamVsPar} over expectation. The math is not wrong.`,
      `Team ${worstTeam[0]} went ${worstTeam[1]} on a par ${par * 2}. That is a net score that requires a calculator.`,
    ]), emoji: "👥" }
  }

  return { text: pick([
    `That hole happened. Let's never speak of it again.`,
    `Average golf. Which is to say, bad.`,
    `The course is winning. You are losing. This is fine.`,
    `That was golf. Points were not awarded.`,
    `The Point strikes again. That's why they call it The Point.`,
    `Some golf was played that hole. That is all we can say.`,
  ]), emoji: "🚶" }
})

function scoreClass(playerId: number) {
  const strokes = getStroke(playerId)
  if (strokes === 0) return ''
  const par = currentPar.value
  if (strokes < par) return 'under'
  if (strokes > par) return 'over'
  return 'even'
}

function getStroke(playerId: number) {
  return scores.value[`${playerId}-${currentHole.value}`] || 0
}

let saveChain = Promise.resolve()

function scheduleSave(playerId: number, strokes: number) {
  const hole = currentHole.value
  const roundId = props.round.id
  saveChain = saveChain.then(() =>
    upsertScore(roundId, hole, playerId, strokes).catch(e =>
      console.error('Save failed', e)
    )
  )
}

function addStroke(playerId: number) {
  const key = `${playerId}-${currentHole.value}`
  scores.value[key] = (scores.value[key] || 0) + 1
  scheduleSave(playerId, scores.value[key])
}

function subStroke(playerId: number) {
  const key = `${playerId}-${currentHole.value}`
  const current = scores.value[key] || 0
  if (current <= 0) return
  scores.value[key] = current - 1
  scheduleSave(playerId, scores.value[key])
}

function prevHole() {
  if (currentHole.value > 1) currentHole.value--
}

function nextHole() {
  if (currentHole.value < 18) currentHole.value++
}

onMounted(async () => {
  players.value = await getPlayers()
  const [allScores, course] = await Promise.all([
    getScores(props.round.id),
    getCourse(),
  ])
  coursePar.value = course.par
  for (const s of allScores) {
    scores.value[`${s.playerId}-${s.holeNumber}`] = s.strokes
  }
  loading.value = false
})
</script>

<template>
  <div class="score-entry">
    <div class="hole-nav">
      <button class="hole-arrow" @click="prevHole">◀</button>
      <span class="hole-label">Hole {{ currentHole }} <span class="hole-par">Par {{ currentPar }}</span></span>
      <button class="hole-arrow" @click="nextHole">▶</button>
    </div>

    <div class="smack-banner" v-if="currentSmack">
      <span class="smack-emoji">{{ currentSmack.emoji }}</span>
      <span class="smack-text">{{ currentSmack.text }}</span>
    </div>

    <div class="player-list">
      <div v-for="team in teamGroups" :key="team.name" class="team-group">
        <div class="team-header">{{ team.name }}</div>
        <div v-for="p in team.players" :key="p.id" class="player-row">
          <div class="player-info">
            <img
              :src="`/avatars/${p.name.toLowerCase()}.jpg`"
              class="player-avatar"
              @error="($event.target as HTMLImageElement).style.display='none'"
            />
            <span class="player-name">{{ p.name }}</span>
          </div>
          <div class="score-controls">
            <button class="btn-minus" @click="subStroke(p.id)">−</button>
            <span class="score-display" :class="scoreClass(p.id)">{{ getStroke(p.id) || '-' }}</span>
            <button class="btn-plus" @click="addStroke(p.id)">+</button>
          </div>
        </div>
      </div>
    </div>

    <div class="totals-bar">
      <div v-for="team in teamTotals" :key="team.name" class="total-item">
        <span class="total-name">{{ team.name }}</span>
        <span class="total-score">{{ team.grandTotal }}</span>
        <span class="total-round">+{{ team.roundTotal }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.score-entry {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.hole-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 10px 12px;
  border-bottom: 1px solid #334155;
  flex-shrink: 0;
}

.hole-arrow {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid #334155;
  background: #1e293b;
  color: #e2e8f0;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.hole-arrow:active {
  background: #334155;
}

.hole-label {
  font-size: 20px;
  font-weight: 600;
  min-width: 130px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.hole-par {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.smack-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #161b22;
  border-bottom: 1px solid #21262d;
  flex-shrink: 0;
}

.smack-emoji {
  font-size: 18px;
  flex-shrink: 0;
}

.smack-text {
  font-size: 14px;
  color: #8b949e;
  line-height: 1.4;
}

.player-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 12px;
}

.team-group {
  margin-bottom: 10px;
}

.team-header {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 6px 0 3px;
}

.player-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.player-name {
  font-size: 16px;
  font-weight: 500;
}

.score-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-minus, .btn-plus {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  font-size: 28px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.btn-minus {
  background: #450a0a;
  color: #fca5a5;
}

.btn-minus:active {
  background: #7f1d1d;
}

.btn-plus {
  background: #052e16;
  color: #86efac;
}

.btn-plus:active {
  background: #14532d;
}

.score-display {
  font-size: 32px;
  font-weight: 700;
  min-width: 36px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.score-display.under { color: #22c55e; }
.score-display.over { color: #ef4444; }
.score-display.even { color: #e2e8f0; }

.totals-bar {
  display: flex;
  border-top: 1px solid #334155;
  background: #1e293b;
  padding: 8px 12px;
  flex-shrink: 0;
}

.total-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.total-name {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.total-score {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.total-round {
  font-size: 10px;
  color: #64748b;
}

@media (max-width: 380px) {
  .hole-nav { gap: 12px; padding: 8px 8px; }
  .hole-arrow { width: 44px; height: 44px; font-size: 18px; }
  .hole-label { font-size: 18px; min-width: 100px; }
  .player-list { padding: 4px 8px; }
  .player-name { font-size: 14px; min-width: 60px; }
  .btn-minus, .btn-plus { width: 44px; height: 44px; font-size: 24px; }
  .score-display { font-size: 28px; min-width: 30px; }
  .totals-bar { padding: 6px 8px; }
  .total-score { font-size: 16px; }
}
</style>
