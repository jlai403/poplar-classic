import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

const DB_PATH = process.env.DB_PATH || './golf.json'

interface Team { id: number; name: string }
interface Player { id: number; name: string; teamId: number }
export interface Round { id: number; name: string; active: boolean; createdAt: string }
export interface Score { id: number; roundId: number; holeNumber: number; playerId: number; strokes: number }

interface Store {
  teams: Team[]
  players: Player[]
  rounds: Round[]
  scores: Score[]
}

function defaultStore(): Store {
  return {
    teams: [
      { id: 1, name: 'Showie' },
      { id: 2, name: 'Dan' },
      { id: 3, name: 'Smott' },
    ],
    players: [
      { id: 1, name: 'Shawn', teamId: 1 },
      { id: 2, name: 'Joey', teamId: 1 },
      { id: 3, name: 'Brendan', teamId: 2 },
      { id: 4, name: 'Aidan', teamId: 2 },
      { id: 5, name: 'Scott', teamId: 3 },
      { id: 6, name: 'Matt', teamId: 3 },
    ],
    rounds: [],
    scores: [],
  }
}

let store: Store

function load(): Store {
  if (existsSync(DB_PATH)) {
    return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
  }
  const dir = dirname(DB_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const data = defaultStore()
  save(data)
  return data
}

function save(s: Store) {
  writeFileSync(DB_PATH, JSON.stringify(s, null, 2))
}

function nextId(items: { id: number }[]) {
  return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1
}

export function initDb() {
  store = load()
  if (store.rounds.length === 0) {
    store.rounds.push({
      id: 1,
      name: 'Copper Point',
      active: true,
      createdAt: new Date().toISOString(),
    })
    save(store)
  }
}

export function getTeams() {
  return store.teams
}

export function getPlayers() {
  return store.players.map(p => ({
    id: p.id,
    name: p.name,
    teamId: p.teamId,
    teamName: store.teams.find(t => t.id === p.teamId)?.name ?? '',
  }))
}

export function getRounds() {
  return [...store.rounds].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getActiveRound(): Round | null {
  return store.rounds.find(r => r.active) ?? null
}

export function createRound(name: string): Round {
  store.rounds.forEach(r => r.active = false)
  const round: Round = {
    id: nextId(store.rounds),
    name,
    active: true,
    createdAt: new Date().toISOString(),
  }
  store.rounds.push(round)
  save(store)
  return round
}

export function getScores(roundId: number): Score[] {
  return store.scores.filter(s => s.roundId === roundId)
}

export function upsertScore(roundId: number, holeNumber: number, playerId: number, strokes: number) {
  const existing = store.scores.find(
    s => s.roundId === roundId && s.holeNumber === holeNumber && s.playerId === playerId,
  )
  if (existing) {
    existing.strokes = strokes
  } else {
    store.scores.push({
      id: nextId(store.scores),
      roundId,
      holeNumber,
      playerId,
      strokes,
    })
  }
  save(store)
}

export const COURSE_PAR = [4, 3, 5, 4, 5, 4, 3, 4, 5, 5, 4, 3, 4, 4, 3, 4, 3, 4]
export const COURSE_TOTAL_PAR = 71

export const STARTING_TOTALS: Record<string, number> = {
  Showie: 138,
  Dan: 147,
  Smott: 142,
}

export function getCourseInfo() {
  return {
    name: 'Copper Point (The Point)',
    tees: 'Blue',
    par: COURSE_PAR,
    totalPar: COURSE_TOTAL_PAR,
    yardage: 6608,
  }
}

export function getLeaderboardData(roundId: number) {
  const teams = store.teams.map(team => {
    const startingTotal = STARTING_TOTALS[team.name] ?? 0
    const teamPlayerIds = store.players.filter(p => p.teamId === team.id).map(p => p.id)
    const roundScores = store.scores.filter(s => s.roundId === roundId && teamPlayerIds.includes(s.playerId))

    const holes: Record<number, { strokes: number; roundTotal: number; par: number; vsPar: number }> = {}
    let roundCumulative = 0
    for (let h = 1; h <= 18; h++) {
      const strokes = roundScores.filter(s => s.holeNumber === h).reduce((sum, s) => sum + s.strokes, 0)
      roundCumulative += strokes
      holes[h] = {
        strokes,
        roundTotal: roundCumulative,
        par: COURSE_PAR[h - 1],
        vsPar: strokes - COURSE_PAR[h - 1],
      }
    }

    const playedPar = Object.values(holes)
      .filter((h: any) => h.strokes > 0)
      .reduce((sum: number, h: any) => sum + h.par, 0)
    const roundVsPar = roundCumulative > 0 ? roundCumulative - playedPar : 0

    return {
      id: team.id,
      name: team.name,
      startingTotal,
      roundTotal: roundCumulative,
      total: startingTotal + roundCumulative,
      roundVsPar,
      holes,
    }
  })

  teams.sort((a, b) => a.total - b.total)
  return { teams }
}
