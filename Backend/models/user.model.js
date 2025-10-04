import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    fullName :{
        type:String,
        requried:true
    },
    username:{
        type: String , 
        required:true , 
    
    },
    email:{
        type:String , 
        required:true , 
        unique:true , 
    },
    password:{
        type:String, 
        required:true , 
        unique:true 
    },
    followers:[
        {
            type: mongoose.Schema.Types.ObjectId , 
            unique:true,
            ref:"User",
            default:[],
        }
    ],
    followings:[
        {
            type:mongoose.Schema.Types.ObjectId , 
            ref:"User",
            default:[]
        }
    ],
    profileImage:{
        type:String,
        default:"",
    },
    coverImage:{
        type:String,
        default:"",
    },
    bio:{
        type:String,
        default:"",
    },
    link:{
        type:String,
        default:""
    }
},{
    timestamps:true
})


const User = mongoose.model("User" , userSchema)
export default User;