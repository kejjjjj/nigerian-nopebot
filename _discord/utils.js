
import { GetDiscordClient } from './main.js';
import dotenv from 'dotenv'; dotenv.config();

export async function CreateThread(channel, threadName) {
    try {
      const thread = await channel.threads.create({
        name: threadName,
      });
      
      console.log(`Thread created! ID: ${thread.id}`);
      return thread;

    } catch (error) {
      console.error('CreateThread(): ', error);
    }
}


export async function GetChannelById(channelId) {
    try {
        const channel = await GetDiscordClient().channels.fetch(channelId);
        return channel;
    } catch (error) {
        console.error('GetChannelById():', error);
        return undefined;
    }
}

export async function GetWebhooks()
{
    const guild = await GetDiscordClient().guilds.fetch(process.env.GUILD_ID);
    const webhooks = await guild.fetchWebhooks();

    return webhooks;
}
export async function GetWebhookByName(name)
{
    const webhooks = await GetWebhooks();

    return webhooks.find(webhook => webhook.name === name);
}
export async function CreateWebhook(name)
{
    const channel = await GetDiscordClient().channels.fetch(process.env.CHANNEL_ID);
    
    const webhook = await channel.createWebhook({
        name: name
    });
    
    console.log(`Webhook created! Name: ${webhook.name}, URL: ${webhook.url}`);
    return webhook;
    
}
