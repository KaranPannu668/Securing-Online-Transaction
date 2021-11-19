
require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const {google}=require("googleapis");
const bcrypt = require("bcryptjs");
const ejs = require('ejs');
const helmet = require("helmet");
const cookieparser = require("cookie-parser");


var nodemailer=require('nodemailer');
var inlineBase64 = require('nodemailer-plugin-inline-base64');
const fs=require('fs');
const sendEmail = require(__dirname + "/views/email.js");

const generateToken = require(__dirname + "/views/token.js");

const app=express();
app.use(helmet());
app.use(cookieparser());
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

const port = process.env.PORT || 1337;
// if(port == null || port == "")
// {
//     port = 1337;
// }


app.use(bodyParser.json({limit: "10mb"}));
app.use(bodyParser.urlencoded({limit: "10mb", extended: true, parameterLimit:50000}));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

require(__dirname+"/db/conn.js");
const Register = require(__dirname+"/models/registers");

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
var img64;
var err_msg_reset="";
let user_username = "";
var err_msg_amount_p="";
let secret_token_login = generateToken(50);
let user_token_login = "";
let secret_session_token = "";
let payment_secret_token = generateToken(50);
let payment_status_token = "";
let received_email_token = "";
let email_verify_port = "";



app.get("/", function(req, res){
    secret_token_login = generateToken(100);
    res.render("practicum-login", {err_msg_l : req.query.err});
});


app.post("/", async function(req, res){
    username=req.body.Username;
    let password=req.body.Password;
    username_reset = username;

    user_username = await Register.Register.findOne({username: username});
    if(user_username == null)
    {
        res.redirect("/?err=*Wrong Username or Password");
        return;
    }
    const isMatch = await bcrypt.compare(password, user_username.password);

    if(isMatch){
        res.cookie("username", username , {maxAge: 1200000, httpOnly: true, sameSite : 'lax'});
       user_token_login = secret_token_login;
        res.status(201).redirect("/payment");
        return;
    }else{
        res.redirect("/?err=*Wrong Username or Password");
        return;
    }

});



app.get("/sign-up", function(req, res){
    res.render("practicum-signup",{err_msg_s : req.query.err , uname_s : uname , pword_s : pword , email_s : email});
    uname = "";
    pword = "";
    email = "";
});


app.post("/sign-up", async function(req, res){
    try{
    err_msg_s="";
    uname=req.body.Username;
    pword=req.body.Password;
    email=req.body.Email;
    let isalreadytaken = await Register.Register.findOne({username : uname});
    if(uname.length<=6)
    {
        uname="";
        res.redirect("/sign-up?err=*Username must be longer than 6 characters");
    }
    else if(pword.length<=5)
    {
        pword="";
        res.redirect("/sign-up?err=*Password must be longer than 5 characters");
    }
    else if(!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)))
    {
        email="";
        res.redirect("/sign-up?err=*Invalid email address");
    }
    else if(isalreadytaken != null)
    {
        res.redirect("/sign-up?=*This username is already taken.")
    }
    else{
            const registerUser = new Register.Register({
                username : uname,
                password : pword,
                email : email,
                amount : 10000000,
                secret_session_token : "null"
            })

            const registered = await registerUser.save();
            res.status(201).redirect("/");


        }
    }catch(error){
        console.log(error);
        res.redirect("/sign-up?err=*There was an error");
        }
    
});




app.get("/payment", function(req, res){

    if(req.cookies.username)
    {
        res.render("practicum-payment",{acc_name_p : acc_name , err_msg_no_p : err_msg_no_p , err_msg_amount_p : err_msg_amount_p , acc_no_p : acc_no , err_msg_code_p : err_msg_code_p , IFSC_p : IFSC , amount_p : amount});
        acc_name="";
        acc_no="";
        IFSC="";
        amount="";
        err_msg_no_p = "";
        err_msg_amount_p = "";
        err_msg_code_p = "";
    }
    else
    {
        res.redirect("/?err=*Please log in first");
    }
    
});


app.post("/payment", function(req, res){

    if(req.cookies.username)
    {
        err_msg_no_p="";
        err_msg_code_p="";
        err_msg_amount_p = "";
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
        else if(amount > user_username.amount || amount <=0)
        {
            if(amount > user_username.amount)
            err_msg_amount_p = "*Insufficient funds";
            else
            err_msg_amount_p = "*Enter a valid amount";

            amount = "";
            res.redirect("/payment");
        }
        else
            res.redirect("/webcam?amount="+amount+"&account="+acc_no);
        
    }
    else
    {
        res.redirect("/?err=*Please log in first");
    }
});


app.get("/webcam", function(req, res){

    if(req.cookies.username)
    {
        if(acc_name == "" || acc_no == "" || IFSC == "" || amount == "")
        res.redirect("/payment");
        else
        res.render("webcam" , {queries : "account=" + req.query.account + "&amount=" + req.query.amount});
    }
    else
    {
        res.redirect("/?err=*Please log in first");
    }
    
});

app.post("/webcam", async function(req, res){

    if(req.cookies.username)
    {
        img64 = req.body.Image64bit;

        const user_username = await Register.Register.findOne({username : req.cookies.username});
        console.log("Account no is: " + req.query.account + " Amount is: " + req.query.amount);
        const _id = user_username._id;
        const secret_session_token = generateToken(100);
         //await Register.Register.findByIdAndUpdate({_id} , {$set : {'request.image' : img64} });
         await Register.Register.updateMany({_id : _id} , {$set : {'request.secret_session_token' : secret_session_token , 'request.account' : req.query.account , 'request.amount' : req.query.amount , 'request.status' : "pending" , 'request.image' : img64}});
        // await Register.Register.findByIdAndUpdate({_id} , {request: {$set : {image : img64} }});
        
       // await Register.Register.findByIdAndUpdate({_id} , {$set : {secret_session_token : secret_session_token}});
        payment_secret_token = generateToken(100);
        const email_verify_port = req.protocol + "://" + req.get('host') + "/verify?token=" + secret_session_token + "&id=" + _id;
        sendEmail(img64, user_username.email , req.query.amount , acc_no.substring((req.query.account).length - 4) , email_verify_port);
        var a = 0;
        let status = "pending";
        while(a<=360)
        {
            status = await Register.Register.findOne({'request.secret_session_token' : secret_session_token}).status;
            console.log(status);
            if(status == "verified")
            {
                res.clearCookie("username");
                res.redirect("/success");
                return;
            }
            if(payment_status_token == "decline")
            {
                res.clearCookie("username");
                res.redirect("/decline");
                return;
            }

            a++;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        if(payment_status_token == "pending")
        {
            await Register.Register.update({username : req.cookies.username} , {$set : {'request.status' : "timed-out"}})
            res.clearCookie("username");
            res.redirect("/error");
        }
        return;
    }
    else
    {
        res.redirect("/?err=*Please log in first");
    }
})



// app.post("/verify-embedded" , function(req, res){
//     received_email_token = req.body.token;
//     if(received_email_token == secret_session_token)
//     res.redirect("localhost:1337/verify");
//     else
//     res.redirect("localhost:1337/expired");
// })



app.get("/verify" , async function(req, res){
    received_email_token = req.query.id;
    const user_username = await Register.Register.findOne({_id : req.query.id});
    const secret_session_token = user_username.request.secret_session_token;
    if(secret_session_token == req.query.token && user_username.request.status == "pending")
    {
        const img64 = user_username.request.image;
        const amount = user_username.request.amount;
        const account = user_username.request.account;
        res.render("verify" , {transactor_image : img64 , amount : amount , account_no : account.substring(account.length - 4) , queries : "token=" + req.query.token + "&id=" + req.query.id});
    }
    else
    res.redirect("/expired");
});


app.post("/verify" , async function(req, res){
    const user_username = await Register.Register.findOne({_id : req.query.id});
    const secret_session_token = user_username.request.secret_session_token;
    if(secret_session_token == req.query.token && user_username.request.status == "pending")
    {
       const status=req.body.verification;

       //Add status to db
    if(status == "1")
    {
        await Register.Register.updateMany({_id : req.query.id} , {$set : {amount : user_username.amount - req.query.amount , 'request.status' : "verified" , 'request.secret_session_token' : generateToken(100)}})
        res.redirect("/confirmed");
    }
    else if(status == "0")
    {
        await Register.Register.updateMany({_id : req.query.id} , {$set : {'request.status' : "denied" , 'request.secret_session_token' : generateToken(100)}})
        res.redirect("/confirmed");
    }
    else
    {
        await Register.Register.updateMany({_id : req.query.id} , {$set : {'request.status' : "denied" , 'request.secret_session_token' : generateToken(100)}})
        res.redirect("/reset");
    
    }
    }
    else
    {
        res.redirect("expired");
    }
});

app.get("/success", function(req, res){
    res.sendFile(__dirname + "/Htmlpages/success.html");
})


app.get("/decline" , function(req, res){
    res.sendFile(__dirname + "/Htmlpages/decline.html");
})

app.get("/error" , function(req, res){
    res.sendFile(__dirname + "/Htmlpages/error.html");
})

app.get("/reset" , function(req, res){
    res.render("reset" , {error_msg_reset : err_msg_reset});
})


app.post("/reset" , async function(req, res){
    if(received_email_token == secret_session_token)
    {
    var oldpassword = req.body.Oldpassword;
    var newpassword = req.body.Newpassword;
    var confirmpassword = req.body.Confirmpassword;

    const isMatch_reset = await bcrypt.compare(oldpassword, user_username.password);

    if(!isMatch_reset)
    {
            err_msg_reset = "*Incorrect password";
            res.redirect("/reset");
            return;
        }
        else if(oldpassword == newpassword)
        {
            err_msg_reset = "*New password cannot be old password";
            res.redirect("/reset");
            return;
        }
        else if(newpassword.length <=5)
        {
            err_msg_reset = "*Password must be longer than 5 characters";
            res.redirect("/reset");
            return;
        }
        else if(newpassword != confirmpassword)
        {
            err_msg_reset = "*Passwords do not match";
            res.redirect("/reset");
            return;
        }
        else
        {
            
            if(Register.Updatepassword(user_username._id , newpassword))
            {
                secret_session_token = generateToken(100);
                res.redirect("/confirmed");
                return;
            }
            else
            {
                err_msg_reset = "*There was an error";
                res.redirect("/reset");
                return;
            }
        }
    }
    else
    res.redirect("/expired");
    
})


app.get("/confirmed" , function(req, res){
    res.sendFile(__dirname + "/Htmlpages/confirmed.html");
})

app.get("/expired" , function(req, res){
    res.sendFile(__dirname + "/Htmlpages/expired.html");
})


app.listen(port, function(req, res){
    console.log("Server running on port 1337");
})