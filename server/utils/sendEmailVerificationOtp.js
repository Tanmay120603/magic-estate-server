const { gmail } = require("../config/gmailClient.js");
const { OtpModel } = require("../model/Otp");
const {getEmailVerificationOtpContent}=require("./getEmailVerificationOtpContent.js")
const crypto = require("crypto");
const { promiseBasedSignToken } = require("./promiseBasedSignToken.js");
const { buildEmail } = require("./buildEmail.js");
require("dotenv").config()

async function sendEmailVerificationOtp(user,otpContext,challengeTokenExtraPayload){
   try{
        const otp = Math.floor(100000 + Math.random() * 900000)
        const sessionId=crypto.randomUUID()
        const challengeToken=await promiseBasedSignToken({sessionId,otpContext,...challengeTokenExtraPayload},{expiresIn:"5m"},process.env.TWOFA_EMAIL_TOKEN_SECRET_KEY)
        
        const raw=buildEmail({to:user.email,subject:"Email verfication through otp",html:getEmailVerificationOtpContent(user,otp)})
        
        await gmail.users.messages.send({userId:"me",requestBody:{raw}})

        await new OtpModel({otp,email:user.email,context:otpContext,sessionId}).save()
        
        return {message:"Please verify your email. If the address exists, we’ve sent an OTP.",challengeToken}
    }
    catch(err){
        throw new Error("Something went wrong while sending otp verification email")
    }
}


exports.sendEmailVerificationOtp=sendEmailVerificationOtp