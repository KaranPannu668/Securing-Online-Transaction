const fs = require("fs");


// fs.writeFile("bio.txt", "This is challenge two", (err)=>{

//     console.log("File is created!");
//     console.log(err);
// });


// fs.appendFile("bio.txt", "This is updated file", (err) => {

//     console.log("File is updated!");
//     console.log(err);
// });

// fs.readFile("bio.txt", "utf-8", (err, data) => {
//     console.log(data);
//     console.log(err);
// });

fs.rename("bio.txt", "mybio.txt", (err) => {
    console.log("File updated");
});