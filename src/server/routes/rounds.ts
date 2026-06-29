import { Hono } from 'hono'
import { getRounds, getActiveRound, createRound } from '../db'

export const roundsRoute = new Hono()

roundsRoute.get('/', (c) => c.json(getRounds()))

roundsRoute.get('/active', (c) => {
  const round = getActiveRound()
  return c.json(round)
})

roundsRoute.post('/', async (c) => {
  const body = await c.req.json<{ name: string }>()
  const round = createRound(body.name)
  return c.json(round, 201)
})
