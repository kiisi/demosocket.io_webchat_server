const express = require('express')
const app = express()
const http = require('http').createServer(app)
const authRoutes = require("./routes/authRoutes")
app.use(express.json())
app.use(authRoutes)
const socketio = require('socket.io')
const cors = require('cors')
const mongoose = require('mongoose')
const Room = require('./models/Room')
const {addUser, removeUser, getUser} = require('./helper')
const Message = require('./models/Message')
app.use(cors)
const io = socketio(http, {cors:{origin:"*"}})
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

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
    })
})

http.listen(PORT, ()=>{
    console.log(`Listening on PORT: ${PORT}`)
})