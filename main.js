import dotenv from 'dotenv';
import express from 'express';
import { google } from 'googleapis';
import fs from 'fs';

import { EmailInit, GetAuth, OAuth, RefreshCallback, GetAccessToken } from './_emails/init.js';

import { DC_StartBot } from './_discord/main.js';
import { sequelize } from './_db/associations.js';

dotenv.config();

const app = express();
const port = 3000;

app.get('/auth/google', OAuth);
app.get('/auth/google/callback', RefreshCallback);

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

fs.writeFileSync('log.txt', '');
fs.writeFileSync('log_error.txt', '');

import { DC_SendNormalMessage } from './_discord/commands/main.js';

const originalLog = console.log;
const originalError = console.error;

const timeZone = 'Europe/Helsinki';
const locale = 'en-GB';

console.log = (...args) => {
    originalLog(...args); 
    fs.appendFileSync('log.txt', `${new Date().toLocaleString(locale, { timeZone: timeZone })}:\t` + args.join(' ') + '\n'); // log to file
};

console.error = (...args) => {
    const string = args.join(' ');

    originalError(string); 
    fs.appendFileSync('log_error.txt', `${new Date().toLocaleString(locale, { timeZone: timeZone })}:\t` + string + '\n'); // log to file
    DC_SendNormalMessage(`ERROR: ${string}`);
};

console.critical = (...args) => {
    const string = args.join(' ');

    originalLog(string); 
    fs.appendFileSync('log_critical.txt', `${new Date().toLocaleString(locale, { timeZone: timeZone })}:\t` + string + '\n'); // log to file
    DC_SendNormalMessage(`CRITICAL: ${string}`);
};

Init();

async function Init()
{
    try{
        if(!sequelize)
            throw "Expression: !sequelize";

        
        await sequelize.sync({force: true});

        await DC_StartBot();
        await EmailInit();
                
    }catch(ex){
        console.error(ex);
    }
}
