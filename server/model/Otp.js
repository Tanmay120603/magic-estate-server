const {Schema,model}=require("mongoose")

const otpSchema=new Schema({
    otp:{type:Number,required:true,minLength:6,maxLength:6},
    email:{type:String,required:true},
    verify_attempts:{type:Number,default:0},
    context:{type:String,required:true,enum:["EMAIL_VERIFY","LOGIN_2FA"]},
    sessionId:{type:String,required:true},
    expiresAt:{type:Date,default:Date.now,expires:150}
})


exports.OtpModel=model("Otp",otpSchema)