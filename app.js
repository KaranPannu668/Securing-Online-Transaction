
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

var err_msg_no_p="";
var err_msg_code_p="";
var uname="";
var pword="";
var email="";
var acc_name="";
var acc_no="";
var IFSC="";
var amount="";
var err_msg_reset="";
let user_username = "";
var err_msg_amount_p="";


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
            res.cookie("login_token", login_token , {maxAge: 1200000, httpOnly: true, secure: true, sameSite : 'lax'});
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
    err_msg_s = "";
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
            uname = "";
            pword = "";
            email = "";
            const registered = await registerUser.save();
            res.status(201).redirect("/");
        }
        
    }catch(error){
        console.log(error);
        res.redirect("/sign-up?err=*There was an error");
        } 
});

app.get("/payment", async function(req, res){
    try{
        const login_token = await Register.Request.findOne({login_token : req.cookies.login_token});
        if(login_token && req.cookies.login_token !='logged-out')
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
        if(login_token && req.cookies.login_token !='logged-out')
        {
            const _id = login_token.userid;
            const user_username = await Register.Register.findOne({_id : _id});
            err_msg_no_p="";
            err_msg_code_p="";
            err_msg_amount_p = "";
            acc_name=req.body.Acc_name;
            acc_no=req.body.Acc_no;
            IFSC=req.body.IFSC;
            amount=req.body.amount;
            const avail_amount = user_username.amount;
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
            else if(amount > avail_amount || amount <=0)
            {
                if(amount > avail_amount)
                err_msg_amount_p = "*Insufficient funds";
                else
                err_msg_amount_p = "*Enter a valid amount";
                amount = "";
                res.redirect("/payment");
            }
            else
                {
                    res.redirect("/webcam?name=" + acc_name +  "&amount=" + amount + "&IFSC=" + IFSC + "&account="+acc_no);
                    acc_name="";
                    acc_no="";
                    IFSC="";
                    amount="";
                    err_msg_no_p = "";
                    err_msg_amount_p = "";
                    err_msg_code_p = "";
                }
            
        }
        else
        {
            res.redirect("/?err=*Please log in first");
            acc_name="";
            acc_no="";
            IFSC="";
            amount="";
            err_msg_no_p = "";
            err_msg_amount_p = "";
            err_msg_code_p = "";
        }

    }catch(error)
    {
        res.redirect("/?err=*There was an error");
        acc_name="";
        acc_no="";
        IFSC="";
        amount="";
        err_msg_no_p = "";
        err_msg_amount_p = "";
        err_msg_code_p = "";
    }

});


app.get("/webcam", async function(req, res){
    try{
        const login_token = await Register.Request.findOne({login_token : req.cookies.login_token})
        if(login_token && req.cookies.login_token !='logged-out')
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
    if(login_token && req.cookies.login_token !='logged-out')
    {
        const img64 = req.body.Image64bit;
        const account_no = req.query.account;
        const user_username = await Register.Register.findOne({_id : login_token.userid});
        const request_id = login_token._id;
        const secret_session_token = generateToken(100);
        await Register.Request.updateMany({_id : login_token._id} , {$set : {session_token : secret_session_token , payee_name : req.query.name , account_no : req.query.account , IFSC : req.query.IFSC , amount : req.query.amount , image : img64}});
        payment_secret_token = generateToken(100);
        const email_verify_port = req.protocol + "://" + req.get('host') + "/verify?token=" + secret_session_token + "&id=" + login_token._id;
        sendEmail(img64, user_username.email , req.query.amount , account_no.substring((req.query.account).length - 4) , email_verify_port);
        res.cookie("count", 1 , {maxAge: 1200000, httpOnly: true, secure: true, sameSite : 'lax'});
        res.redirect("/waiting");
        // var a = 0;
        // let received_request;
        // let payment_status = "pending";
        // while(a<=360)
        // {
        //      received_request = await Register.Request.findOne({_id : request_id});
        //      payment_status = received_request.payment_status;
        //     if(payment_status == "verified")
        //     {
        //         res.clearCookie("login_token");
        //         res.redirect("/success");
        //         return;
        //     }
        //     if(payment_status == "denied" || payment_status == "password-changed")
        //     {
        //         res.clearCookie("login_token");
        //         res.redirect("/decline");
        //         return;
        //     }

        //     a++;
        //     await new Promise(resolve => setTimeout(resolve, 500));
        // }
        // if(payment_status == "pending")
        // {
        //     await Register.Register.updateMany({login_token : req.cookies.login_token} , {$set : {payment_status : "timed-out" , session_token : "logged-out" , login_token : "logged-out"}});
        //     res.clearCookie("login_token");
        //     res.redirect("/error");
        // }
        // return;
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




app.get("/waiting" , async function(req , res){
    try{
        const login_token = await Register.Request.findOne({login_token : req.cookies.login_token})
        if(login_token && req.cookies.login_token !='logged-out')
        {
            res.render("waiting");
        }
        else
        res.redirect("/?err=*Please log in first");

    }catch(error)
    {
        res.redirect("/?err=*There was an error");
    }
});


app.post("/waiting" , async function(req , res){
    try{
        const login_token = await Register.Request.findOne({login_token : req.cookies.login_token})
        if(login_token && req.cookies.login_token !='logged-out')
        {
            var count = parseInt(req.cookies.count , 10);
            const request_id = login_token._id;
            if(count <= 10)
            {
                var a = 0;
                let received_request;
                let payment_status;
                while(a<=20)
                {
                    received_request = await Register.Request.findOne({_id : request_id});
                    payment_status = received_request.payment_status;
                    if(payment_status == "verified")
                    {
                        await Register.Request.updateOne({_id : request_id} , {$set : {login_token : "logged-out"}})
                        res.clearCookie("login_token");
                        res.redirect("/success");
                        return;
                    }
                    if(payment_status == "denied" || payment_status == "password-changed")
                    {
                        await Register.Request.updateOne({_id : request_id} , {$set : {login_token : "logged-out"}})
                        res.clearCookie("login_token");
                        res.redirect("/decline");
                        return;
                    }

                    a++;
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            else
            {
                await Register.Request.updateMany({login_token : req.cookies.login_token} , {$set : {payment_status : "timed-out" , session_token : "logged-out" , login_token : "logged-out"}});
                res.clearCookie("login_token");
                res.redirect("/error");
                return;
            }
            count = count+1;
            res.cookie("count", count , {maxAge: 1200000, httpOnly: true, secure: true, sameSite : 'lax'});
            res.redirect("/waiting");
            
        }
        else
        res.redirect("/?err=*Please log in first");

    }catch(error)
    {
        console.log(error);
        res.redirect("/?err=*There was an error");
    }
})





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
        await Register.Request.updateMany({_id : req.query.id} , {$set : {payment_status : "verified" , session_token : "logged-out"}})

        res.redirect("/confirmed");
    }
    else if(status == "0")
    {
        await Register.Request.updateMany({_id : req.query.id} , {$set : {payment_status : "denied" , session_token : "logged-out"}})
        res.redirect("/confirmed");
    }
    else
    {
        await Register.Request.updateMany({_id : req.query.id} , {$set : {payment_status : "password-changed"}})
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