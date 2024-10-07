
import { GetChannelById, CreateThread } from './utils.js';
import dotenv from 'dotenv'; dotenv.config();

const channelId = process.env.CHANNEL_ID;

export async function DC_CreateThread(title)
{
    const thread = await CreateThread(await GetChannelById(channelId), title);
    return thread;
}

export async function DC_GetThreadById(threadId) {
    const channel = await GetChannelById(channelId);

    if(!channel)
        throw "!channel";

    const thread = await channel.threads.fetch(threadId);

    return thread;
}