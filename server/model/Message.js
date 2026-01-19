const {Schema,model}=require("mongoose")

const MessageSchema=new Schema({
    content:{type:String,required:true},
    createdAt:{type:Number,default:Date.now()},
    seenBy:[{type:Schema.Types.ObjectId}],
    chatId:{type:Schema.Types.ObjectId,required:true},
    senderId:{type:Schema.Types.ObjectId,required:true},
    receiverId:{type:Schema.Types.ObjectId,required:true}
})

exports.Message=model("Message",MessageSchema)