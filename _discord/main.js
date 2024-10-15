
import { Client, GatewayIntentBits, EmbedBuilder, ThreadChannel } from "discord.js";
import { Discord } from '../_db/discord.js';

import { DC_OnMessageCreate } from './commands/main.js';

import dotenv from 'dotenv'; dotenv.config();

let client = undefined;

export function GetDiscordClient()
{
    if(!client)
        throw "GetDiscordClient(): !client";

    return client;
}


export async function DC_StartBot() {

    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
    });

    client.once("ready", () => {
        console.log("Ready!");
    });

    client.on("messageCreate", async (message) => {
        await DC_OnMessageCreate(client, message);
    }); 

    try {

        await Discord.Init(); //register the database
        await client.login(process.env.DISCORD_BOT_TOKEN);

        // console.log('Bot logged in successfully.');

        // if(!await GetWebhookByName(process.env.WEBHOOK_TARGET)){
        //     await CreateWebhook(process.env.WEBHOOK_TARGET);
        // }

        // if(!await GetWebhookByName(process.env.WEBHOOK_SELF)){
        //     await CreateWebhook(process.env.WEBHOOK_SELF);
        // }

    } catch (error) {
        console.error('Failed to login:', error);
    }

    return;    
}

