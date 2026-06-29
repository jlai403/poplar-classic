import { Hono } from 'hono'
import { getScores, upsertScore } from '../db'

export const scoresRoute = new Hono()

scoresRoute.get('/:roundId', (c) => {
  const roundId = Number(c.req.param('roundId'))
  return c.json(getScores(roundId))
})

scoresRoute.put('/', async (c) => {
  const body = await c.req.json<{
    roundId: number
    holeNumber: number
    playerId: number
    strokes: number
  }>()
  upsertScore(body.roundId, body.holeNumber, body.playerId, body.strokes)
  return c.json({ ok: true })
})
