
const express=require("express");
const bodyParser=require("body-parser");
const {google}=require("googleapis");

const app=express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const google_sheets=require(__dirname+"/views/google-sheets.js");


app.get("/", function(req, res){

    res.sendFile(__dirname+"/practicum-login.html"); 

});


app.post("/", async function(req, res){

    let username=req.body.Username;
    let password=req.body.Password;
    var valid= await google_sheets.verify(username, password);
    if(valid==1)
    res.redirect("/photo-verify");
    else
    res.redirect("/");

});




app.get("/photo-verify", function(req, res){
    res.send("You're in!");
});


app.get("/practicum-signup.html", function(req, res){
    res.sendFile(__dirname+"/practicum-signup.html");
});


app.post("/practicum-signup.html", async function(req, res){
    const uname=req.body.Username;
    const pword=req.body.Password;
    const email=req.body.Email;
    google_sheets.append(uname, pword, email);
    res.redirect("/");
});


app.listen(1337, function(req, res){
    console.log("Server running on port 1337");
})