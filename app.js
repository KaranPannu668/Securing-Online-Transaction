
require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const {google}=require("googleapis");
const bcrypt = require("bcryptjs");
const ejs = require('ejs');
var nodemailer=require('nodemailer');
var inlineBase64 = require('nodemailer-plugin-inline-base64');
const fs=require('fs');
const sendEmail = require(__dirname + "/views/email.js");

const generateToken = require(__dirname + "/views/token.js");

const app=express();
const port = process.env.PORT || 1337;
app.use(bodyParser.json({limit: "10mb"}));
app.use(bodyParser.urlencoded({limit: "10mb", extended: true, parameterLimit:50000}));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

require(__dirname+"/db/conn.js");
const Register = require(__dirname+"/models/registers");

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
var img64;
var err_msg_reset="";
let user_username;
var err_msg_amount_p="";
let secret_token_login = generateToken(50);
let user_token_login = "";
let secret_session_token = "";
let payment_secret_token = generateToken(50);
let payment_status_token = "";
let received_email_token = "";



app.get("/", function(req, res){
    secret_token_login = generateToken(100);
    res.render("practicum-login", {err_msg_l : err_msg_l});
    err_msg_l="";
});


app.post("/", async function(req, res){
    err_msg_l="";
    username=req.body.Username;
    let password=req.body.Password;
    username_reset = username;

    user_username = await Register.Register.findOne({username: username});
    if(user_username == null)
    {
        err_msg_l = "*Username does not exist";
        res.redirect("/");
        return;
    }
    const isMatch = await bcrypt.compare(password, user_username.password);

    if(isMatch){
       user_token_login = secret_token_login;
        res.status(201).redirect("/payment");
        return;
    }else{
        err_msg_l="*Wrong Username or Password";
        res.redirect("/");
        return;
    }

});



app.get("/sign-up", function(req, res){
    res.render("practicum-signup",{err_msg_s : err_msg_s , uname_s : uname , pword_s : pword , email_s : email});
    err_msg_s = "";
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
    else if(isalreadytaken != null)
    {
        err_msg_s = "*This username is already taken.";
        res.redirect("/sign-up")
    }
    else{
            const registerUser = new Register.Register({
                username : uname,
                password : pword,
                email : email,
                amount : 10000000
            })

            const registered = await registerUser.save();
            res.status(201).redirect("/");


        }
    }catch(error){
        console.log(error);
        err_msg_s = "*There was an error";
        res.redirect("/sign-up");
           // res.status(400).send(error);
        }
    
});




app.get("/payment", function(req, res){

    if(user_token_login == secret_token_login)
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
        err_msg_l = "Please log in first."
        res.redirect("/");
    }
    
});


app.post("/payment", function(req, res){

    if(user_token_login == secret_token_login)
    {
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
        res.redirect("/webcam");
    }
    else
    {
        err_msg_l = "Please log in first."
        res.redirect("/");
    }
});


app.get("/webcam", function(req, res){

    if(user_token_login == secret_token_login)
    {
        if(acc_name == "" || acc_no == "" || IFSC == "" || amount == "")
        res.redirect("/payment");
        else
        res.sendFile(__dirname+"/Htmlpages/webcam.html");
    }
    else
    {
        err_msg_l = "Please log in first."
        res.redirect("/");
    }
    
});

app.post("/webcam", async function(req, res){

    if(user_token_login == secret_token_login)
    {
        img64 = req.body.Image64bit;
        secret_session_token = generateToken(100);
        payment_secret_token = generateToken(100);
        sendEmail(img64, user_username.email , amount , acc_no.substring(acc_no.length - 4) , secret_session_token);
        var a = 0;
        while(a<=360)
        {
            if(payment_status_token == payment_secret_token)
            {
               if(Register.UpdateAmount(user_username._id , user_username.amount - amount))
            {
                payment_secret_token = generateToken(100);
                payment_status_token = "";
                secret_token_login = generateToken(100);
                user_token_login = "";
                res.redirect("/success");
                return;
             }
             else
             {
                 res.redirect("/decline");
                 return;
             }
            }
            if(payment_status_token == "--------------------")
            {
                payment_status_token == "";
                payment_secret_token = generateToken(100);
                secret_token_login = generateToken(100);
                user_token_login = "";
                res.redirect("/decline");
                return;
            }

            a++;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        if(payment_status_token == "")
        {

            secret_token_login = generateToken(100);
            user_token_login = "";
            res.redirect("/error");
        }
        return;
    }
    else
    {
        err_msg_l = "Please log in first."
        res.redirect("/");
    }
})


app.post("/verify-embedded" , function(req, res){
    received_email_token = req.body.token;
    if(received_email_token == secret_session_token)
    res.redirect("http://localhost:1337/verify");
    else
    res.redirect("http://localhost:1337/expired");
})



app.get("/verify" , function(req, res){
    if(received_email_token == secret_session_token)
    {
        res.render("verify" , {transactor_image : img64 , amount : amount , account_no : acc_no.substring(acc_no.length - 4)});
    }
    else
    res.redirect("/expired");
});


app.post("/verify" , function(req, res){
    if(received_email_token == secret_session_token)
    {
       let status=req.body.verification;
    if(status == "1" || status == "0")
    {
        payment_status_token = payment_secret_token;
        secret_session_token = generateToken(100);
        received_email_token = "";
        res.redirect("/confirmed");
    }
    else
    {
        payment_status_token = "--------------------";
        secret_session_token = generateToken(100);
        received_email_token = "";
        res.redirect("/reset");
    
    }
    }
    else
    res.redirect("/expired");
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