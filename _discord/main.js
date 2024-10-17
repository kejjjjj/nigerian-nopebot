
import { Client, GatewayIntentBits, EmbedBuilder, ThreadChannel } from "discord.js";
import { Discord } from '../_db/discord.js';
import { Guilds_Init } from '../_db/discord.js';

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
        await client.login(process.env.DISCORD_BOT_TOKEN);

        await Guilds_Init(); //register guilds and channels
        await Discord.Init(); //register the discord database

        console.log('Bot logged in successfully.');


    } catch (error) {
        console.log('Failed to login:', error);
    }

    return;    
}

