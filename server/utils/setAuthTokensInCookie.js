exports.setAuthTokenInCookie=function(res,accessToken,refreshToken,accessTokenAge,refreshTokenAge){
    res.cookie("accessToken",accessToken,{httpOnly:true,maxAge:accessTokenAge,secure:false})
    res.cookie("refreshToken",refreshToken,{httpOnly:true,maxAge:refreshTokenAge,secure:false})
}
