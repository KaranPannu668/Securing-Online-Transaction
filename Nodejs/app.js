// ----->File System---------//

const fs = require("fs");
const { networkInterfaces } = require("os");


// ---------Creating a newfile.
// fs.writeFileSync("read.txt", "welcome to my channel");



//-----------FOllowing will overwrite the code
// fs.writeFileSync("read.txt", "Aksh, welcome to my channel");
// fs.appendFileSync("read.txt", " How are you?");



////----->Buffer data
// const buf_data = fs.readFileSync("read.txt")

// org_data = buf_data.toString();
// console.log(org_data);

// Nodejs include an additional data type called Buffer
// (not available in browser's javascript)
// Buffer is used to store Binary data,
// while reading from a file or recieving packets over the networkInterfaces.

{/* <Buffer 41 6b 73 68 2c 20 77 65 6c 63 6f 6d 65 20 74 6f 20 6d 79 20 63 68 61 6e
6e 65 6c 0d 0a 0d 0a 20 48 6f 77 20 61 72 65 20 79 6f 75 3f> */}



// fs.renameSync("read.txt", "readwrite.txt");

// --------------------------------------------OPERATING SYSYTEM----------------------------------------------------------------------------------------//

