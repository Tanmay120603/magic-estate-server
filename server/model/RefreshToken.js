const {Schema,model}=require("mongoose")

const refreshTokenSchema=new Schema({
    refreshToken:{type:String,required:true},
    isBlackListed:{type:Boolean,default:false},
    username:{type:String,required:true},
    expiresAt:{type:Date,default:Date.now,expires:60*60*24*7}
})

const RefreshTokenModel=model("RefreshToken",refreshTokenSchema)

exports.RefreshTokenModel=RefreshTokenModel