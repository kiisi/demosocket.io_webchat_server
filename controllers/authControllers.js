const User = require('../models/User')
const jwt = require("jsonwebtoken")

const maxAge = 5 * 24 * 60 * 60
const createJWT = (id) =>{
    return jwt.sign({id}, 'secret key', {
        expiresIn: maxAge
    })
}

const alertError = (err) =>{
    let errors = {name:'', email:'', password:''}

    console.log(err.message)
    console.log(err.code)

    if(err.message === 'incorrect email'){
        errors.email = 'Email not found!'
    }
    if(err.message === 'incorrect password'){
        errors.password = 'Password is incorrect!'
    }

    if(err.code === 11000){
        errors.email = 'This email is already registered'
        return errors
    }

    if(err.message.includes('user validation failed')){
        Object.values(err.errors).forEach(({properties}) =>{
            errors[properties.path] = properties.message 
        })
    }
    return errors
}
module.exports.signup = async (req, res) =>{

    const {name, email, password} = req.body

    try{
        const user = await User.create({name, email, password}) 
        const token = createJWT(user._id)
        res.cookie('jwt', token, {httpOnly: true, maxAge: maxAge * 1000})
        user.password = undefined
        res.status(201).json({user})
    }
    catch(error){
        res.status(400).json({errors: alertError(error)})
    }
}

module.exports.login = async (req, res) =>{
    const {email, password} = req.body

    try{
        const user = await User.login(email, password)
        user.password = undefined
        res.status(201).json({user})
    }
    catch(error){
        alertError(error)
        res.status(400).json({errors: alertError(error)})
    }
}

module.exports.verifyuser = (req, res, next) =>{
    const token = req.cookies.jwt
    console.log("Token from cookies", token)
    if(token){
        jwt.verify(token, 'secret key', async (err, decodedToken) =>{
            console.log(decodedToken)
            if(err){
                console.log(err)
            }else{
                let user = await User.findById(decodedToken.id);
                user.password = undefined
                res.json(user)
                console.log(user)
                next()
            }
        })
    }else{
        next()
    }
}

module.exports.logout = (req, res) =>{
    res.cookie('jwt', '', {maxAge: 1})
    res.status(200).json({logout: true})
}