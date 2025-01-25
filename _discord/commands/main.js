
import { EmbedBuilder } from "discord.js";
import dotenv from 'dotenv'; dotenv.config();

import { GetDiscordClient } from '../main.js';
import { DC_Personality, DC_LateNotice, DC_Dig } from './response.js';

import { DC_BlockString, DC_UnblockString, DC_GetBlocked } from './blacklist.js';

import { sequelize } from '../../_db/associations.js';
import { DeleteEverything } from '../../_db/main.js';

import { GetTargetChannelIds } from '../../_db/discord.js'; 

import { Delay } from '../../_emails/utils.js';

const admins = process.env.DISCORD_ADMINS.split(',');

export function isAdmin(userid) { return admins.findIndex(admin => admin === userid) !== -1; }

const commands = [
    { name: "panic",        callback: DC_Panic,        adminOnly: true },
    { name: "reset",        callback: DC_Reset,        adminOnly: true },
    { name: "personality",  callback: DC_Personality,  adminOnly: true },
    { name: "lateNotice",   callback: DC_LateNotice,   adminOnly: true },

    { name: "dig",          callback: DC_Dig,          adminOnly: true },

    { name: "blacklist",    callback: DC_BlockString,  adminOnly: true },
    { name: "whitelist",    callback: DC_UnblockString,adminOnly: true },
    { name: "blacklisted",  callback: DC_GetBlocked,   adminOnly: true },
];


export function SendMessage(message, text)
{
    return ChannelMessage(message.channel, text);
}
export function ChannelMessage(channel, text)
{

    if(typeof(text) === "string" && text.length > 2000)
        text = text.substr(0, 2000);

    if(text.length === 0)
        return;

    return channel.send(text);
}

export function SendFailureMessage(message, title, description)
{
    const embed = new EmbedBuilder().setColor(0xFF0000).setTitle(title).setDescription(description);
    return message.channel.send({ embeds: [ embed ] });
}
export function SendSuccessMessage(message, title, description)
{
    const embed = new EmbedBuilder().setColor(0x00FF00).setTitle(title).setDescription(description);
    return message.channel.send({ embeds: [ embed ] });
}

export async function DC_OnMessageCreate(client, message)
{
    const TARGET_CHANNEL_IDS = await GetTargetChannelIds();
    try{

        if(!TARGET_CHANNEL_IDS.includes(message.channel.id) && message.author.id !== client.user.id)
            return;

        const content = message.content.trim();

        // Return if the message content is empty or doesn't start with '!'
        if (!content?.startsWith('!') || (content?.length ?? 0) < 2)
            return;

        //separate the command and arguments
        //join all "" commands into one argument instead of multiple
        const [command, ...args] = content.slice(1).match(/(?:[^\s"]+|"[^"]*")+/g);

        // Removing surrounding quotes from quoted arguments
        const processedArgs = args.map(arg => arg.replace(/(^")|("$)/g, ''));

        const func = commands.find( func => command === func.name );

        if(!func?.callback)
            return SendFailureMessage(message, "Unrecognized command", "yep read the title");

        if(func.adminOnly && !isAdmin(message.author.id))
            return SendFailureMessage(message, "Unauthorized", `you can't use this`);

        await func.callback( message, processedArgs );

    }catch(ex){
        console.error(ex);
    }

} 

 
async function DC_Panic(message, args)
{

    SendSuccessMessage(message, "Success!", "The process will exit in 5 seconds!");
    await Delay(5000);
    process.exit(1);
}

export async function DC_Reset(message, args)
{
    if((args?.length ?? 0) !== 1)
        return SendFailureMessage(message, "Syntax Error", "expected <query>");

    const client = GetDiscordClient();
    const query = args[0];

    switch(query){
        case "everything":
            return SendSuccessMessage(message, "Success!", "The entire database will be wiped (including discord threads)!");
            await DeleteEverything();
        default:
            return SendFailureMessage(message, "Syntax Error", "Unrecognized query!");
            break;
    }   



}

export async function DC_SendNormalMessage(msg, channelId)
{

    try{
        const client = GetDiscordClient();

        if(!msg || !client)
            throw "!msg || !client";

        if(channelId){
            const channel = client?.channels?.cache?.get(channelId);

            if (channel) {
                await ChannelMessage(channel, msg);
            }

            return;
        }

        const TARGET_CHANNEL_IDS = await GetTargetChannelIds();

        //send message here
        for(const id of TARGET_CHANNEL_IDS) {
            const channel = client?.channels?.cache?.get(id);
            if (channel) {
                await ChannelMessage(channel, msg);
            }
        }

    }catch(ex){
        console.log("DC_SendNormalMessage(): ", ex);
    }
}

