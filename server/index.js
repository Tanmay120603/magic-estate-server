const mongoose=require("mongoose")
const express=require("express")
const http=require("http")
const cors=require("cors")
const {Server}=require("socket.io")
const cookieParser=require("cookie-parser")
const path = require("path")
const { verifyToken } = require("./middleware/verifyToken.js")
const AuthRouter=require("./routes/auth.js")["router"]
const UserRouter=require("./routes/user.js")["router"]
const PostRouter=require("./routes/post.js")["router"]
const ChatRouter=require("./routes/chat.js")["router"]
const MessageRouter=require("./routes/message.js")["router"]
const socketHandler=require("./socketHandler.js")["socketHandler"]
require("dotenv").config()

const server=express()
const httpServer=http.createServer(server)
const io=new Server(httpServer,{cors:{
  origin:process.env.FRONTEND_URL,
  methods:"GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials:true
}})

server.use(cors({origin:process.env.FRONTEND_URL,methods:"GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",credentials:true}))
server.use(express.json())
server.use(cookieParser())
server.use("/api/auth",AuthRouter)
server.use("/api/user",verifyToken,UserRouter)
server.use("/api/posts",PostRouter)
server.use("/api/chats",ChatRouter)
server.use("/api/messages",MessageRouter)
server.use(express.static(process.env.STATIC_ROOT))

server.get("*",(req,res)=>{
  res.sendFile(path.resolve(__dirname,process.env.STATIC_ROOT,"index.html"))
})

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.rt3uxtg.mongodb.net/Real-Estate-db?retryWrites=true&w=majority&appName=Cluster0`,{ignoreUndefined:true});
}

httpServer.listen(process.env.PORT,()=>{
  socketHandler(io)
})

