import dotenv from 'dotenv';
import express from 'express';
import { google } from 'googleapis';

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

Init();

async function Init()
{
    try{
        if(!sequelize)
            throw "Expression: !sequelize";

        await sequelize.sync();

        await DC_StartBot();
        await EmailInit();
                
    }catch(ex){
        console.error(ex);
    }
}