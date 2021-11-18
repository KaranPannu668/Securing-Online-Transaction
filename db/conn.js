const mongoose = require("mongoose");

mongoose.connect(process.env.DB_CONNECTION_MONGO_ATLAS,{
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