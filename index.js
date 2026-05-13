require('dotenv').config()
const express=require('express')
const cors=require('cors')
const cookieParser=require('cookie-parser')
const connectDB = require('./config/db')
const userRoutes = require('./routes/user')

const app=express()

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))

app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

app.use('/api/users', userRoutes)

PORT=process.env.PORT || 3000

connectDB().then(()=>{
    console.log("DB Connection Successful")
    app.listen(PORT, ()=>{
        console.log("The Server is running on port", PORT)
        console.log(`The Server has started at port ${PORT}`)
    })
})