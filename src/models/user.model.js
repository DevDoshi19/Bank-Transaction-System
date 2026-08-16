const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
    
    email:{
        type:String,
        require:[true,"Email is require to create a new user"],
        trim:true,
        unique:[true,"Email Already exist"],
        lowercase:true,
        match:[/^[^\s@]+@[^\s@]+\.[^\s@]+$/,"Invalid email format"]
    },
    name :{
        type:String,
        require:[true,"Name is require to create a new user"],
        unique:[true,"Name Already exist"],
    },
    password:{
        type:String,
        require:[true,"Password is require to create a new user"],
        minlength:[6,"Password must be at least 6 characters long"],
        select:false
    
    }
},{
    timestamps:true
})

// working -> pre will run before saving the user to the database, if the password is not modified then we will just call next() to move to the next middleware, if the password is modified then we will hash it and then call next() to move to the next middleware
userSchema.pre("save",async function(next){
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
