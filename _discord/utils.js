
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