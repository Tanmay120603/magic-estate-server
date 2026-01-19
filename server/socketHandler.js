const {socketAuth} = require("./middleware/socketAuth.js")

const Message=require("./model/Message.js")["Message"]
const {Chat}=require("./model/Chat.js")
require("dotenv").config()

let onlineUsers=new Map()

function socketHandler(io){

io.use((socket,next)=>{
  socketAuth(socket,next)
})

io.on("connection",(socket)=>{
  const {userId}=socket.auth
  socket.on("user-connected",({socketId})=>{
      onlineUsers.set(userId,{socketId})
  })

  socket.on("typing",({chatId,receiverId})=>{
    const receiver=onlineUsers.get(receiverId)
    if(receiver?.chatId===chatId)socket.to(receiver?.socketId).emit("user-typing")
  })

  socket.on("stop-typing",({chatId,receiverId})=>{
    const receiver=onlineUsers.get(receiverId)
    if(receiver?.chatId===chatId)socket.to(receiver?.socketId).emit("user-typing-stop")
  })

  socket.on("chat-connected",async({chatId})=>{
      await Message.updateMany({chatId,seenBy:{$nin:userId}},{$push:{seenBy:userId}})
      onlineUsers.set(userId,{...onlineUsers.get(userId),chatId})
  })

  socket.on("close-chat",()=>{
    delete onlineUsers.get(userId)?.chatId
  })

  socket.on("send-message",async(messageObj)=>{
    const receiver=onlineUsers.get(messageObj?.receiverId)
      const message=new Message(messageObj)
      const {_id:messageId}=await message.save()
      await Chat.findByIdAndUpdate(messageObj?.chatId,{$push:{messages:messageId},lastMessage:messageObj?.content})
    if(!receiver)return
    
    if(receiver.chatId===messageObj.chatId){
      message.seenBy.push(messageObj.receiverId)
      await message.save()
      return socket.to(receiver.socketId).emit("receive-message",{...messageObj}) 
    }

    socket.to(receiver.socketId).emit("receive-notification",{chatId:messageObj?.chatId,message:messageObj})
  })

  socket.on("user-disconnect",()=>{
    onlineUsers.delete(userId)
  })

})
}

exports.socketHandler=socketHandler