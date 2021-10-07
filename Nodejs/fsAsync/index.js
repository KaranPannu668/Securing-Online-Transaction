const fs = require("fs");


// fs.writeFile("read1.txt", "Hello today is the awesome day", (err)=>{
//     console.log("file is created ");
//     console.log(err);
// });

// fs.appendFile("read1.txt", " Please like and share this function", (err) => {
//     console.log("task completed");
// });


fs.readFile("read1.txt","UTF-8", (err, data) =>{
    console.log(data);
});