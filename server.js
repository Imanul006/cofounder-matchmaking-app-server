const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cors = require('cors')
const passport = require('passport')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })


const PORT = process.env.PORT || 8080

// Import routes
const userRoutes = require('./routes/user_routes')
const postRoutes = require('./routes/post_routes')
const cofounderRoutes = require('./routes/cofounder_routes')

// Setup environment variables
dotenv.config()

const app = express()

// // Socket.io implementation
// const http = require('http');
// const server = http.createServer(app);
// const { Server } = require("socket.io");
// const io = new Server(server);

// io.on('connection', (socket) => {
//     console.log("A user connected on Socket");
// });

// Connecting to the database
mongoose.connect(process.env.DATABASE_STRING, {useNewUrlParser: true}, (error) => {
    if (error) {
        console.log("Unable to connect with mongo!!! Error Msg : " + error)
    } else {
        console.log("Connected to the database successfully...")
    }
})

// Middlewares
app.use('/api/v1/public', express.static('public'))
app.use(morgan('dev'))
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(passport.initialize())

// Initializing passport authentication
require("./config/passport")(passport)

// Get Request to check if server is running
app.get("/status", (req, res) => {
    res.json("Server running perfectly....")
})

//Route Middlewares
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/posts', passport.authenticate('jwt', { session : false }), postRoutes)
app.use('/api/v1/cofounder', passport.authenticate('jwt', { session : false }), cofounderRoutes)

// Running the server
app.listen(PORT, () => {
    console.log("Server is Running on PORT " + PORT + "...")
})