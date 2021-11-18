
var nodemailer=require('nodemailer');
var fs=require('fs');
const handlebars = require("handlebars");
const { env } = require('process');

const readHTMLFile = function(path, callback) {
    fs.readFile(path, { encoding: "utf-8" }, function(err, html) {
      if (err) {
        throw err;
        callback(err);
      } else {
        callback(null, html);
      }
    });
  };

const sendEmail = (img_64 , user_email , amount , account_no , secret_session_token ) => {
    var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "hakbanking091126@gmail.com",
          pass: "12011009_11_26"
        }
      });
    readHTMLFile(
      __dirname + "/verify-embedded.html",
      function(err, html) {
        var template = handlebars.compile(html);
        var replacements = {
          amount: amount,
          account_no : account_no,
          email_session_token : secret_session_token
         };
        var htmlToSend = template(replacements);
        var mailOptions = {
          from: "hakbanking091126@gmail.com",
          to: user_email,
          subject: "Verify your online payment",
          attachments: [
            {   // encoded string as an attachment
              filename: 'transactor_image.jpg',
              content: img_64.split("base64,")[1],
              encoding: 'base64',
              cid: 'imagename'
            }
          ],
          html: htmlToSend
        };
        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            console.log(error);
            callback(error);
          } else {
            console.log("Email Sent : " + info.response);
          }
        });
      }
    );
  };

  module.exports =sendEmail;