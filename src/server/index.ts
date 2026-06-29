import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { readFileSync } from 'fs'
import { initDb, getPlayers, getCourseInfo } from './db'
import { teamsRoute } from './routes/teams'
import { roundsRoute } from './routes/rounds'
import { scoresRoute } from './routes/scores'
import { leaderboardRoute } from './routes/leaderboard'

initDb()

const app = new Hono()

app.use('/api/*', cors())

app.route('/api/teams', teamsRoute)
app.route('/api/rounds', roundsRoute)
app.route('/api/scores', scoresRoute)
app.route('/api/leaderboard', leaderboardRoute)

app.get('/api/players', (c) => c.json(getPlayers()))
app.get('/api/course', (c) => c.json(getCourseInfo()))

if (process.env.NODE_ENV === 'production') {
  const indexHtml = readFileSync('./dist/index.html', 'utf-8')

  app.get('/assets/*', serveStatic({ root: './dist' }))
  app.get('*', (c) => c.html(indexHtml))
}

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`)
})
