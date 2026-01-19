const { RefreshTokenModel } = require("../model/RefreshToken")
const { generateTokens } = require("../utils/generateTokens")
const { setAuthTokenInCookie } = require("../utils/setAuthTokensInCookie")
const {promiseBasedVerifyToken}=require("../utils/promiseBasedVerifyToken.js")
require("dotenv").config()

exports.verifyToken=async function(req,res,next){
    try{
    const {accessToken,refreshToken}=req.cookies
    if(!accessToken && !refreshToken)return res.status(401).json({message:"Unauthenticated user",is_auth:false})

    if(accessToken){
        const {is_valid,payload}=await promiseBasedVerifyToken(accessToken,process.env.ACCESS_TOKEN_SECRET_KEY)
        if(is_valid){
            req.user=payload
            return next()
        }
    }
    const refreshTokenDoc=await RefreshTokenModel.findOne({refreshToken})
    if(!refreshTokenDoc)return res.status(401).json({message:"Unauthenticated user",is_auth:false})
    if(refreshTokenDoc.isBlackListed){
        await RefreshTokenModel.deleteMany({username:refreshTokenDoc.username})
        return res.status(401).json({message:"Refresh token is blacklisted!. Unauthenticated user",is_auth:false,token_blacklisted:true})
    }
    
    const {is_valid,payload}=await promiseBasedVerifyToken(refreshToken,process.env.REFRESH_TOKEN_SECRET_KEY)
    if(!is_valid)return res.status(401).json({message:"Token Invalid!. Unauthenticated user",is_auth:false})
    await RefreshTokenModel.updateOne({refreshToken},{isBlackListed:true})
    
    const {username,userEmail,userId}=payload
    const {accessToken:newAccessToken,refreshToken:newRefreshToken,accessTokenAge,refreshTokenAge}=await generateTokens({username,userEmail,userId})
    setAuthTokenInCookie(res,newAccessToken,newRefreshToken,accessTokenAge,refreshTokenAge)
    req.user=payload
    next()
    }
    catch(err){
        res.json(500,{message:"Internal server error"})
    }
}