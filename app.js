
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
const { logging } = require('googleapis/build/src/apis/logging');
const { request } = require('http');
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


app.use(express.json({limit: "10mb"}));
app.use(express.urlencoded({limit: "10mb", extended: true, parameterLimit:50000}));

app.set("view engine", "ejs");
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
    res.render("practicum-login", {err_msg_l : req.query.err});
});


app.post("/", async function(req, res){
    try{
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
            const login_token = generateToken(100);

            const registerRequest = Register.Request({
                login_token : login_token,
                userid : user_username._id,
                payment_status : "pending"
            })
            const registered = await registerRequest.save();
            res.cookie("login_token", login_token , {maxAge: 1200000, httpOnly: true, sameSite : 'lax'});
        user_token_login = secret_token_login;
            res.status(201).redirect("/payment");
            return;
        }else{
            res.redirect("/?err=*Wrong Username or Password");
            return;
    }
    }catch(error)
    {
        res.redirect("/?err=*There was an error");
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
        uname = "";
        pword = "";
        email = "";
    }catch(error){
        console.log(error);
        res.redirect("/sign-up?err=*There was an error");
        }
    
});




app.get("/payment", async function(req, res){
    try{
        const login_token = await Register.Request.findOne({login_token : req.cookies.login_token});
        if(login_token)
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
    }catch(error)
    {
        res.redirect("/sign-up?err=*There was an error");
    }
    
});


app.post("/payment", async function(req, res){
    try{
        const login_token = await Register.Request.findOne({login_token : req.cookies.login_token})
        if(login_token)
        {
            const user_username = Register.Register.findOne({_id : login_token.userid})
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
                res.redirect("/webcam?name=" + acc_name +  "&amount=" + amount + "&IFSC=" + IFSC + "&account="+acc_no);
            
        }
        else
        {
            res.redirect("/?err=*Please log in first");
        }

            acc_name="";
            acc_no="";
            IFSC="";
            amount="";
            err_msg_no_p = "";
            err_msg_amount_p = "";
            err_msg_code_p = "";
    }catch(error)
    {
        res.redirect("/?err=*There was an error");
    }

});


app.get("/webcam", async function(req, res){
    try{
        const login_token = await Register.Request.findOne({login_token : req.cookies.login_token})
        if(login_token)
        {
            if(req.query.name == "" || req.query.account == "" || req.query.IFSC == "" || req.query.amount == "")
            res.redirect("/payment");
            else
            res.render("webcam" , {queries : "name=" + req.query.name + "&IFSC=" + req.query.IFSC + "&account=" + req.query.account + "&amount=" + req.query.amount});
        }
        else
        {
            res.redirect("/?err=*Please log in first");
        }
    }catch(error)
    {
        res.redirect("/?err=*There was an error");
    }
    
});

app.post("/webcam", async function(req, res){
    try{
    const login_token = await Register.Request.findOne({login_token : req.cookies.login_token})
    if(login_token)
    {
        img64 = req.body.Image64bit;

        const user_username = await Register.Register.findOne({_id : login_token.userid});
        console.log("Account no is: " + req.query.account + " Amount is: " + req.query.amount);
        //const _id = login_token.userid;
        const request_id = login_token._id;
        const secret_session_token = generateToken(100);
         //await Register.Register.findByIdAndUpdate({_id} , {$set : {'request.image' : img64} });
         await Register.Request.updateMany({_id : login_token._id} , {$set : {session_token : secret_session_token , payee_name : req.query.name , account_no : req.query.account , IFSC : req.query.IFSC , amount : req.query.amount , status : "pending" , image : img64}});
        // await Register.Register.findByIdAndUpdate({_id} , {request: {$set : {image : img64} }});
        
       // await Register.Register.findByIdAndUpdate({_id} , {$set : {secret_session_token : secret_session_token}});
        payment_secret_token = generateToken(100);
        const email_verify_port = req.protocol + "://" + req.get('host') + "/verify?token=" + secret_session_token + "&id=" + login_token._id;
        sendEmail(img64, user_username.email , req.query.amount , acc_no.substring((req.query.account).length - 4) , email_verify_port);
        var a = 0;
        let received_request;
        let payment_status = "pending";
        while(a<=360)
        {
             received_request = await Register.Request.findOne({_id : request_id});
             payment_status = received_request.payment_status;
            if(payment_status == "verified")
            {
                //await Register.Register.findByIdAndUpdate({_id} , {$set : {amount : user_username.amount - req.query.amount}});
                //await Register.Request.findByIdAndUpdate({request_id} , {$set : {login_token : "logged-out"}})
                res.clearCookie("login_token");
                res.redirect("/success");
                return;
            }
            if(payment_status == "denied" || payment_status == "password-changed")
            {
                //await Register.Request.findByIdAndUpdate({request_id} , {$set : {login_token : "logged-out"}})
                res.clearCookie("login_token");
                res.redirect("/decline");
                return;
            }

            a++;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        if(payment_status == "pending")
        {
            //await Register.Request.findByIdAndUpdate({request_id} , {$set : {login_token : "logged-out"}})
            await Register.Register.update({login_token : req.cookies.login_token} , {$set : {payment_status : "timed-out"}})
            res.clearCookie("username");
            res.redirect("/error");
        }
        return;
    }
    else
    {
        res.redirect("/?err=*Please log in first");
    }
    }catch(error)
    {
        res.redirect("/?err=*There was an error");
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
    const received_request = await Register.Request.findOne({session_token : req.query.token});
    if(received_request !=null && received_request != undefined)
    {
    if(req.query.token == received_request.session_token && received_request.session_token != "logged-out")
    {
        const img64 = received_request.image;
        const amount = received_request.amount;
        const account = received_request.account_no;
        res.render("verify" , {transactor_image : img64 , amount : amount , account_no : account.substring(account.length - 4) , queries : "token=" + req.query.token + "&id=" + req.query.id});
    }
    else
    res.redirect("/expired");
    }
    else
    res.redirect("/expired");
});


app.post("/verify" , async function(req, res){
    const received_request = await Register.Request.findOne({session_token : req.query.token});
    if(received_request !=null && received_request != undefined)
    {
    const _id = received_request.userid;
    const user_username = await Register.Register.findOne({_id : _id});
    if(req.query.token == received_request.session_token && received_request.session_token != "logged-out")
    {
       const status=req.body.verification;
    if(status == "1")
    {
        await Register.Register.findByIdAndUpdate({_id} , {$set : {amount : user_username.amount - received_request.amount}})
        await Register.Request.updateMany({_id : req.query.id} , {$set : {payment_status : "verified" , session_token : "logged-out" , login_token : "logged-out"}})

        res.redirect("/confirmed");
    }
    else if(status == "0")
    {
        await Register.Request.updateMany({_id : req.query.id} , {$set : {payment_status : "denied" , session_token : "logged-out" , login_token : "logged-out"}})
        res.redirect("/confirmed");
    }
    else
    {
        await Register.Request.updateMany({_id : req.query.id} , {$set : {payment_status : "password-changed" , login_token : "logged-out"}})
        res.redirect("/reset?token=" + req.query.token + "&id=" + req.query.id);
    
    }
    }
    else
        res.redirect("expired");
    }
    else
        res.redirect("expired");
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

app.get("/reset" , async function(req, res){
    const received_request = await Register.Request.findOne({session_token : req.query.token});
    if(received_request !=null && received_request != undefined)
    {
    if(req.query.token == received_request.session_token && received_request.session_token != "logged-out")
    {
        res.render("reset" , {error_msg_reset : err_msg_reset , queries : "token=" + req.query.token + "&id=" + req.query.id});
    }
    else
    res.redirect("/expired");
    }
    else
    res.redirect("/expired");
})


app.post("/reset" , async function(req, res){
    const received_request = await Register.Request.findOne({session_token : req.query.token});
    if(received_request !=null && received_request != undefined)
    {
    const _id = received_request.userid;
    const request_id = req.query.id;
    const user_username = await Register.Register.findOne({_id : _id});

    if(req.query.token == received_request.session_token && received_request.session_token != "logged-out")
    {
    const oldpassword = req.body.Oldpassword;
    let newpassword = req.body.Newpassword;
    const confirmpassword = req.body.Confirmpassword;

    const isMatch_reset = await bcrypt.compare(oldpassword, user_username.password);

    if(!isMatch_reset)
    {
            err_msg_reset = "*Incorrect password";
            res.redirect("/reset?token=" + req.query.token + "&id=" + req.query.id);
            return;
        }
        else if(oldpassword == newpassword)
        {
            err_msg_reset = "*New password cannot be old password";
            res.redirect("/reset?token=" + req.query.token + "&id=" + req.query.id);
            return;
        }
        else if(newpassword.length <=5)
        {
            err_msg_reset = "*Password must be longer than 5 characters";
            res.redirect("/reset?token=" + req.query.token + "&id=" + req.query.id);
            return;
        }
        else if(newpassword != confirmpassword)
        {
            err_msg_reset = "*Passwords do not match";
            res.redirect("/reset?token=" + req.query.token + "&id=" + req.query.id);
            return;
        }
        else
        {
            newpassword = await bcrypt.hash(newpassword , 10);
            await Register.Register.findByIdAndUpdate({_id} , {$set : {password : newpassword}})
            await Register.Request.updateOne({session_token : req.query.token} , {$set : {session_token : "logged-out"}})
            res.redirect("/confirmed");
        }
    }
    else
    res.redirect("/expired");
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