const mongoose = require("mongoose");

mongoose.connect(DB_CONNECTION_MONGO_ATLAS)
    .then(() => console.log("connection successfull........."))
    .catch((err) => console.log(err));