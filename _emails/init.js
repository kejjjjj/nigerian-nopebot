import dotenv from 'dotenv'; dotenv.config();
import { google } from 'googleapis';

import axios from 'axios';


import { PollEmails } from './polling.js'; 

const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'http://localhost:3000/auth/google/callback' // Redirect URI
);

let gmail = undefined;

export function GetGmail()
{
    if(!gmail)
        throw "GetGmail(): !gmail";

    return gmail;
}

export function GetAuth()
{
    return oAuth2Client;
}
  
// Endpoint to initiate OAuth flow
export function OAuth(req, res) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://mail.google.com/'], // Scopes for Gmail API
    });
    res.redirect(authUrl);
}

export async function RefreshCallback(req, res){

    const { code } = req.query;
    const { tokens } = await oAuth2Client.getToken(code);
    
    // Store refresh token securely (for this example, we just log it)
    console.log('Refresh Token:', tokens.refresh_token);
    
    // Set credentials
    oAuth2Client.setCredentials(tokens);
    
    res.send('Authentication successful! You can close this tab.');
}

// Function to get a new access token using the refresh token
async function GetAccessTokenInternal() {
    try {
        const response = await axios.post('https://oauth2.googleapis.com/token', null, {
            params: {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                refresh_token: process.env.REFRESH_TOKEN, // Update this after initial authorization
                grant_type: 'refresh_token',
            },
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error.response.data);
        throw error;
    }
}
  
export async function GetAccessToken()
{
    const accessToken = await GetAccessTokenInternal(); // Get access token
    oAuth2Client.setCredentials({ access_token: accessToken }); // Set access token

    return accessToken;
}

export async function EmailInit()
{
    
    try{
        const auth = GetAuth();

        gmail = google.gmail({ version: 'v1', auth });
        await PollEmails( auth );
        setInterval(async () => { await PollEmails( auth ); }, 60000);

    }catch(ex){
        console.log("ERROR: ", ex);

    }

}
