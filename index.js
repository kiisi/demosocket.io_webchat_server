const express = require('express')
const app = express()
const cors = require('cors')
const http = require('http').createServer(app)
const cookieParser = require('cookie-parser')
const authRoutes = require("./routes/authRoutes")

app.use(express.json())
app.use(cookieParser())
// Don't put trailing slash / in origin
const corsOption = {
    origin: 'http://localhost:3000',
    credentials:true,
    optionsSuccessStatus: 200
}
app.use(cors(corsOption)) 
app.use(authRoutes)

const socketio = require('socket.io')
const mongoose = require('mongoose')
const Room = require('./models/Room')
const {addUser, removeUser, getUser} = require('./helper')
const Message = require('./models/Message')
const io = socketio(http, {cors: corsOption})
const PORT = process.env.PORT || 5000

const mongoDB = "mongodb+srv://kiisifelix:kiisifelix2006@nodejs-chat.odc39.mongodb.net/chat-database?retryWrites=true&w=majority"

mongoose.connect(mongoDB).then(()=>console.log("connected")).catch(error=>console.log(error))


io.on("connection", (socket) =>{
    console.log(socket.id)

    Room.find().then(result=>{
        socket.emit('output-rooms', result)
    })

    socket.on('create-room', name =>{
        const room = new Room({name})
        room.save().then((result)=>{
            io.emit('room-created', result)
        }).catch(error=>console.log(error))
    })


    socket.on('join', ({name, room_id, user_id}) =>{
        const {error, user} = addUser({
            socket_id:socket.id,
            name,
            room_id,
            user_id
        })

        socket.join(room_id)

        if(error){
            console.log('join error: ', error)
        }else{
            console.log('join user:', user)
        }
    })

    socket.on('sendMessage', (message, room_id, callback) =>{
        const user = getUser(socket.id)
        const msgToStore = {
            name:user.name,
            user_id:user.user_id,
            room_id,
            message
        }
        const msg = new Message(msgToStore)
        msg.save().then(result=>{
            io.to(room_id).emit('message', result)
            callback();
        }).catch(error=>console.log(error))
        
    })

    socket.on('get-messages-history', room_id => {
        Message.find({ room_id }).then(result => {
            socket.emit('output-messages', result)
        })
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
    })
})


http.listen(PORT, ()=>{
    console.log(`Listening on PORT: ${PORT}`)
})