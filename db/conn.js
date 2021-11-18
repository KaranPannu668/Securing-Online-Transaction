require('dotenv').config();
const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://practicum_credentials_mongo_atlas:aofSnqpeiSFfhaAFoAOAsdfg43i8ynv9384057@cluster0.osuy6.mongodb.net/login-credentials",{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    //useCreateIndex: true,
    autoIndex: false,
    connectTimeoutMS: 0,
    socketTimeoutMS: 0,
    family: 4
    }).then(()=>{
        console.log("Connection successful");
    }).catch((e)=>{
        console.log("Connection unsuccessful"+e);
    })