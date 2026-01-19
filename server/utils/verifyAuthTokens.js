const { RefreshTokenModel } = require("../model/RefreshToken")
const { generateTokens } = require("./generateTokens")
const { promiseBasedVerifyToken } = require("./promiseBasedVerifyToken")
const { setAuthTokenInCookie } = require("./setAuthTokensInCookie")
require("dotenv").config()

exports.verifyAuthTokens=async function(context,accessToken,refreshToken,res){
    if(!accessToken && !refreshToken)return {is_auth:false}
    if(accessToken){
        const {is_valid,payload}=await promiseBasedVerifyToken(accessToken,process.env.ACCESS_TOKEN_SECRET_KEY)
        if(is_valid){
            return {is_auth:true,payload}
        }
    }

    const refreshTokenDoc=await RefreshTokenModel.findOne({refreshToken})
    if(!refreshTokenDoc)return {is_auth:false}
    if(refreshTokenDoc.isBlackListed){
        await RefreshTokenModel.deleteMany({username:refreshTokenDoc.username})
        return {is_auth:false}
    }
    
    const {is_valid,payload}=await promiseBasedVerifyToken(refreshToken,process.env.REFRESH_TOKEN_SECRET_KEY)
    if(!is_valid)return {is_auth:false}
    if(context==="socketAuth")return {is_auth:true,payload}
    await RefreshTokenModel.updateOne({refreshToken},{isBlackListed:true})
    
    const {username,userEmail,userId}=payload
    const {accessToken:newAccessToken,refreshToken:newRefreshToken,accessTokenAge,refreshTokenAge}=await generateTokens({username,userEmail,userId})
    setAuthTokenInCookie(res,newAccessToken,newRefreshToken,accessTokenAge,refreshTokenAge)
    return {is_auth:true,payload}
}