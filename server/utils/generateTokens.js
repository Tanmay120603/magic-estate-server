const jwt=require("jsonwebtoken")
const {RefreshTokenModel}=require("../model/RefreshToken.js")
const { promiseBasedSignToken } = require("./promiseBasedSignToken.js")
require("dotenv").config()

async function generateTokens(payload){
    const accessTokenAge=1000*60*5
    const refreshTokenAge=1000*60*60*24*7

    const accessToken=await promiseBasedSignToken(payload,{expiresIn:"5m"},process.env.ACCESS_TOKEN_SECRET_KEY)
    const refreshToken=await promiseBasedSignToken(payload,{expiresIn:"7d"},process.env.REFRESH_TOKEN_SECRET_KEY)

    await new RefreshTokenModel({refreshToken,username:payload.username}).save()

    return {accessToken,refreshToken,accessTokenAge,refreshTokenAge}
    
}

exports.generateTokens=generateTokens