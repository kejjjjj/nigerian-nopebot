
import { Client, GatewayIntentBits, EmbedBuilder, ThreadChannel } from "discord.js";
import { GetWebhookByName, CreateWebhook } from './utils.js';

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


    try {
        await client.login(process.env.DISCORD_BOT_TOKEN);
        console.log('Bot logged in successfully.');

        
        if(!await GetWebhookByName("Enemy")){
            await CreateWebhook("Enemy");
        }

        if(!await GetWebhookByName("Seppo Varjus")){
            await CreateWebhook("Seppo Varjus");
        }

    } catch (error) {
        console.error('Failed to login:', error);
    }

    return;    
}

