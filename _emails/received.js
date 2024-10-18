import dotenv from 'dotenv'; dotenv.config();

import { ReplyToThread } from './send.js';

import { GenerateReplyToScam } from '../_openai/received.js';

import { GetGmail } from './init.js';
import { GetThreadData } from './inbox.js';
import { CreateNewThread } from './threads.js';

import { Channel } from '../_db/discord.js';
import { Blacklist } from '../_db/blacklist.js';

import { DC_SendNormalMessage } from '../_discord/commands/main.js';


export async function HandleLatestMessageInThreadWithId(threadId, rawMessage, email)
{
    const gmailThread = await GetGmail().users.threads.get({
        userId: 'me',
        id: threadId,
    });

    return await HandleLatestMessageInThread(gmailThread, rawMessage, email);
}

export async function HandleLatestMessageInThread(gmailThread, rawMessage, email)
{
    const data = await GetThreadData(gmailThread);

    if(!data)
        return;

    if(!rawMessage || !rawMessage.data || !rawMessage.data.payload)
        throw "HandleLatestMessageInThread(): !rawMessage || !rawMessage.data || !rawMessage.data.payload";

    if(await Blacklist.IncludesBlockedString(email.from)){
        return await DC_SendNormalMessage(`Ignoring blacklisted sender: ${email.from}`);
    }

    //error message!
    if(email.content.length < 1 
        || email.content.includes("The response from the remote server was:")
        || email.content.includes("The response was:"))
        return;

    if(!await data.NeedsResponse()){
        console.log("no response needed");
        return;
    }

    console.log("response needed!");

    const threadId = gmailThread.data.id;
    const thread = data.ThreadExists() ? data.thread : await CreateNewThread(threadId, email);

    if(!thread)
        throw "HandleLatestMessageInThread(): !thread";

    const messages = await thread.GetMessages();

    if(!messages){
        throw "HandleLatestMessageInThread(): !messages";
    }

    if(messages.length > 100){
        console.error("too many messages in thread: ", threadId);
        return;
    }

    const discordThreads = await thread.GetAllDiscordThreads();

    //send the target's message to discord
    //but don't send a duplicate if this thread was created now
    if(data.ThreadExists()){
        for(const dcThread of discordThreads)
            await dcThread.SendMessageInThread(messages[messages.length-1].content, await dcThread.GetWebhookByName(process.env.WEBHOOK_TARGET));
    }

    const result = await GenerateReplyToScam(messages);
    if(!result)
        throw "HandleLatestMessageInThread(): !result";

    //reply to the email
    await ReplyToThread(threadId, rawMessage, result);

    for(const dcThread of discordThreads){

        //send the reply to discord
        await dcThread.SendMessageInThread(result, await dcThread.GetWebhookByName(process.env.WEBHOOK_SELF));

        //notify the servers :)
        const url = await dcThread.GetLatestMessageDiscordURL();
        const msg = `Replied to ${url}!`;

        const channel = await Channel.findByPk(dcThread.channelId);

        if(channel){
            await DC_SendNormalMessage(msg, channel.channelId);
        }
        else
            console.error("HandleLatestMessageInThread(): !(await Channel.findByPk(dcThread.channelId))");
    

    }
}