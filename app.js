
const express=require("express");
const bodyParser=require("body-parser");
const {google}=require("googleapis");

const app=express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const google_sheets=require(__dirname+"/views/google-sheets.js");

var err_msg_l="";
var err_msg_s="";
var err_msg_no_p="";
var err_msg_code_p="";
var uname="";
var pword="";
var email="";
var acc_name="";
var acc_no="";
var IFSC="";
var amount="";

app.get("/", function(req, res){
    
    err_msg_l="";
    err_msg_s="";
    err_msg_no_p="";
    err_msg_code_p="";
    uname="";
    pword="";
    email="";
    acc_name="";
    acc_no="";
    IFSC="";
    amount="";
    res.render("practicum-login", {err_msg_l : err_msg_l});

});


app.post("/", async function(req, res){
    err_msg_l="";
    let username=req.body.Username;
    let password=req.body.Password;
    var valid= await google_sheets.verify(username, password);
    if(valid==1)
    res.redirect("/payment");
    else
    {
        err_msg_l="*Wrong Username or Password";
        res.redirect("/");
    }

});




app.get("/payment", function(req, res){
    res.render("practicum-payment",{acc_name_p : acc_name , err_msg_no_p : err_msg_no_p , acc_no_p : acc_no , err_msg_code_p : err_msg_code_p , IFSC_p : IFSC , amount_p : amount});
});


app.post("/payment", function(req, res){
    err_msg_no_p="";
    err_msg_code_p="";
    acc_name=req.body.Acc_name;
    acc_no=req.body.Acc_no;
    IFSC=req.body.IFSC;
    amount=req.body.amount;
    if(acc_no.length<9||acc_no.length>18)
    {
        err_msg_no_p="*Invalid account number";
        acc_no="";
        res.redirect("/payment");
    }
    else if(!(/^[A-Z]{4}0[A-Z0-9]{6}$/.test(IFSC)))
    {
        err_msg_code_p="*Invalid IFSC code";
        IFSC="";
        res.redirect("/payment");
    }
    else
    res.redirect("/webcam");
});


app.get("/webcam", function(req, res){
    res.sendFile(__dirname+"/Webcam/webcam.html");
});


app.get("/sign-up", function(req, res){
    res.render("practicum-signup",{err_msg_s : err_msg_s , uname_s : uname , pword_s : pword , email_s : email});
});


app.post("/sign-up", async function(req, res){
    err_msg_s="";
    uname=req.body.Username;
    pword=req.body.Password;
    email=req.body.Email;
    if(uname.length<=6)
    {
        err_msg_s="*Username must be longer than 6 characters";
        uname="";
        res.redirect("/sign-up");
    }
    else if(pword.length<=5)
    {
        err_msg_s="*Password must be longer than 5 characters";
        pword="";
        res.redirect("/sign-up");
    }
    else if(!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)))
    {
        err_msg_s="*Invalid email address";
        email="";
        res.redirect("/sign-up");
    }
    else{
        google_sheets.append(uname, pword, email);
    res.redirect("/");
    }
    
});


app.listen(1337, function(req, res){
    console.log("Server running on port 1337");
})