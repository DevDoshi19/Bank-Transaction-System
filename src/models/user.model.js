const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
    
    email:{
        type:String,
        required:[true,"Email is require to create a new user"],
        trim:true,
        unique:[true,"Email Already exist"],
        lowercase:true,
        match:[/^[^\s@]+@[^\s@]+\.[^\s@]+$/,"Invalid email format"]
    },
    name :{
        type:String,
        required:[true,"Name is require to create a new user"],
        unique:[true,"Name Already exist"],
    },
    password:{
        type:String,
        required:[true,"Password is require to create a new user"],
        minlength:[6,"Password must be at least 6 characters long"],
        select:false  // this will not return the password when we query the user from the database we explicitly need to select the password field when we query the user from the database
    
    },
    systemUser:{
        type:Boolean,
        default:false,
        immutable:true, // this will ensure that the systemUser field cannot be updated once it is set
        select:false 
    }
},{
    timestamps:true
})

// working -> pre will run before saving the user to the database, if the password is not modified then we don't need to hash it again, if the password is modified then we will hash it and save it to the database
userSchema.pre("save",async function(){
    // check if the password is modified, if not then we don't need to hash it again
    if (!this.isModified("password")){
        return ;
    }
    const hash = await bcrypt.hash(this.password,10);
    this.password = hash;

})

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password,this.password)
}

const userModel = mongoose.model("User",userSchema)

module.exports = userModel;
