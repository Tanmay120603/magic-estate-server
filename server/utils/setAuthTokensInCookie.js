require("dotenv").config()
exports.setAuthTokenInCookie=function(res,accessToken,refreshToken,accessTokenAge,refreshTokenAge){
    res.cookie("accessToken",accessToken,{httpOnly:true,maxAge:accessTokenAge,secure:process.env.BUILD=="prod"})
    res.cookie("refreshToken",refreshToken,{httpOnly:true,maxAge:refreshTokenAge,secure:process.env.BUILD=="prod"})
}
