require('dotenv').config()
const express      = require('express')
const cors         = require('cors')
const cookieParser = require('cookie-parser')
const connectDB    = require('./config/db')

const userRoutes              = require('./routes/user')
const projectRoutes           = require('./routes/project')
const deptHoursRoutes         = require('./routes/deptHours')
const allocRoutes             = require('./routes/allocations')
const weeklyPlanRoutes          = require('./routes/weeklyPlans')
const weeklyCapRoutes           = require('./routes/weeklyCap')
const weeklyProjectConfigRoutes = require('./routes/weeklyProjectConfig')
const workLogRoutes           = require('./routes/workLogs')
const auditLogRoutes          = require('./routes/auditLogs')
const summaryRoutes           = require('./routes/summary')
const reportRoutes            = require('./routes/report')
const projectProgressRoutes   = require('./routes/projectProgress')

const app = express()

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

app.use('/api/users',                userRoutes)
app.use('/api/projects',             projectRoutes)
app.use('/api/dept-hours',           deptHoursRoutes)
app.use('/api/allocations',          allocRoutes)
app.use('/api/weekly-plans',          weeklyPlanRoutes)
app.use('/api/weekly-cap',            weeklyCapRoutes)
app.use('/api/weekly-project-config', weeklyProjectConfigRoutes)
app.use('/api/work-logs',            workLogRoutes)
app.use('/api/audit-logs',           auditLogRoutes)
app.use('/api/weekly-summary',       summaryRoutes)
app.use('/api/reports',              reportRoutes)
app.use('/api/project-progress',     projectProgressRoutes)

const PORT = process.env.PORT || 3000

connectDB().then(() => {
  console.log('DB Connection Successful')
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})
