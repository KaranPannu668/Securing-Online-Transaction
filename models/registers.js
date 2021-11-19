const { hasBrowserCrypto } = require("google-auth-library/build/src/crypto/crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
   
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    amount: {
        type: Number
    },
    request : {
        secret_session_token: {
            type: String
        },
        account : {
            type : String
        },
        amount : {
            type: Number
        },
        status: {
                type : String
            },
        image: {
            type : String
        },
    }
})


userSchema.pre("save", async function(next){
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

// Creating a collection

const Register = new mongoose.model("Register", userSchema);

async function Updatepassword(_id, newpassword){
    let result;
    
    try{
            result = await Register.findByIdAndUpdate({_id}, {$set: {password: await bcrypt.hash(newpassword, 10)}} , {new: true, useFindAndModify: false});
           console.log(result);
           if(result)
            return 1;
            else
            return -1;
        }catch(err){
            if(result)
            return 1;
            else
            return -1;
        }
}

async function UpdateAmount(_id, amount){
    let result_amount;
    
    try{
            result_amount = await Register.findByIdAndUpdate({_id}, {$set: {amount : amount }} , {new: true, useFindAndModify: false});
           if(result_amount)
            return 1;
            else
            return -1;
        }catch(err){
            if(result_amount)
            return 1;
            else
            return -1;
        }
}




module.exports = {Register , Updatepassword , UpdateAmount};