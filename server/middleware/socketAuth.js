const cookie=require("cookie")
const {verifyAuthTokens}=require("../utils/verifyAuthTokens.js")

async function socketAuth(socket,next){
  const jsonCookie=cookie.parse(socket.handshake.headers.cookie || "")
  const {accessToken,refreshToken}=jsonCookie
  const {is_auth,payload}=await verifyAuthTokens("socketAuth",accessToken,refreshToken)
  if(!is_auth)return next(new Error("Authentication error. Unauthenticated user!"))
  socket.auth=payload
  next()
}

exports.socketAuth=socketAuth