const {Schema,model}=require("mongoose")

const UserSchema=Schema({
    username:{type:String,required:true,unique:true,minlength:3,maxlength:32},
    email:{type:String,unique:true,required:true,validate:{
        validator:function(value){
            return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(value)
        },
        message:"Email is not valid"
    }},
    password:{type:String,minlength:6},
    is_email_verified:{type:Boolean,default:false},
    passkey_for_2FA:{type:String,default:null}, 
    avatar:{type:String,default:"https://w7.pngwing.com/pngs/205/731/png-transparent-default-avatar-thumbnail.png"},
    Posts:{type:[Schema.Types.ObjectId],ref:"Post"},
    savedPost:{type:[Schema.Types.ObjectId],ref:"Post"},
    createdAt:{type:Date,default:Date.now()}
})

const User=model("User",UserSchema)

exports.User=User