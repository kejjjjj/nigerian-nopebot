
import { EmbedBuilder } from "discord.js";
import dotenv from 'dotenv'; dotenv.config();

import { GetDiscordClient } from '../main.js';
import { DC_Personality, DC_Dig } from './response.js';

const admins = process.env.DISCORD_ADMINS.split(',');
const TARGET_CHANNEL_IDS = process.env.COMMAND_ACTIVATION_CHANNELS.split(',');

export function isAdmin(userid) { return admins.findIndex(admin => admin === userid) !== -1; }

const commands = [
    { name: "personality",  callback: DC_Personality,  adminOnly: true },
    { name: "dig",          callback: DC_Dig,          adminOnly: true },
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