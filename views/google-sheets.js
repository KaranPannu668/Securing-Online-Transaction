

module.exports={verify, append};

async function verify(username, password){

    const {google}=require("googleapis");
    
const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});


//Create client instance for auth
const client = await auth.getClient();


//Instance of Google Sheets API
const googleSheets = google.sheets({version: "v4", auth: client});


const spreadsheetId="1ECWenWxA9-augJDZRfCWjxJaDu_R35ecRJ_QCoz90xs";

//Get metadata about spreadsheet
const metaData=await googleSheets.spreadsheets.get({
    auth: auth,
    spreadsheetId
});


//Read rows from spreadsheets
const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "Sheet1!A:D",
});


var valid=0;
    for(var i=1;i<getRows.data.values.length;i++)
    {
        if(getRows.data.values[i][1]==username&&getRows.data.values[i][2]==password)
            valid=1;
    }

    return valid;

}


async function append(username, password, email){

    const {google}=require("googleapis");
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    
    
    //Create client instance for auth
    const client = await auth.getClient();
    
    
    //Instance of Google Sheets API
    const googleSheets = google.sheets({version: "v4", auth: client});
    
    
    const spreadsheetId="1ECWenWxA9-augJDZRfCWjxJaDu_R35ecRJ_QCoz90xs";
    
    //Get metadata about spreadsheet
    const metaData=await googleSheets.spreadsheets.get({
        auth: auth,
        spreadsheetId
    });


    //Read rows from spreadsheets
    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: "Sheet1!A:D",
    });



    //Write row to spreadsheet
    await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: "Sheet1!A:D",
        valueInputOption: "USER_ENTERED",
        resource:{
            values:[[getRows.data.values.length, username, password, email]]
        }
    });

}