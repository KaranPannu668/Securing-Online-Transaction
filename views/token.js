
function generateToken(length)
{
    var source = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz1234567890";
    var token = "";
    for(var i = 1; i<=length; i++)
    {
        token = token + source.charAt(Math.ceil(Math.random()*72));
    }
    return token;
}


module.exports = generateToken;