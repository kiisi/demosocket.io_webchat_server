const mongoose = require("mongoose")
const {isEmail} = require("validator")
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Please enter a name"]
    },
    email:{
        type:String,
        required:[true, "Please enter an email"],
        unique:true,
        lowercase:true,
        validate:[isEmail, "Please enter  a valid email"]
    },
    password:{
        type:String,
        required:[true, "Enter a password"],
        minlength:[6, "Password length should be at least 6 characters long"]
    }
},{timestamps:true})

// Before document is saved
userSchema.pre("save", async function(next){
    const salt = await bcrypt.genSalt()

    this.password = await bcrypt.hash(this.password, salt)

    // `this` -- refers to the User model
    console.log("Before saving", this)
    next()
})

// After document is saved
// userSchema.post("save", function(doc, next){
//     console.log("After saving", doc)
//     next()
// })

// Login users

userSchema.statics.login = async function(email, password){
    const user = await this.findOne({email})

    if(user){
        const isAuthenticated = await bcrypt.compare(password, user.password)
        if(isAuthenticated){
            return user
        }
        throw Error("incorrect password")
    }else{
        throw Error("incorrect email")
    }
}

const User = mongoose.model('user', userSchema)
module.exports = User