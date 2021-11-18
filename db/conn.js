const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://practicum_credentials_mongo_atlas:aofSnqpeiSFfhaAFoAOAsdfg43i8ynv9384057@cluster0.osuy6.mongodb.net/login-credentials")
    .then(() => console.log("connection successfull........."))
    .catch((err) => console.log(err));