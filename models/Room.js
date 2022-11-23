const mongoose = require("mongoose")

const roomSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    }
},{timestamps:true})

const Room = mongoose.model('room', roomSchema)
module.exports = Room