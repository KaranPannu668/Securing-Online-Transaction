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
        required: true,
    },
    History: [
        {
            image: {
                type: Buffer
            }
        }
    ]
})


userSchema.pre("save", async function(next){
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

// Creating a collection

const Register = new mongoose.model("Register", userSchema);

module.exports = Register;