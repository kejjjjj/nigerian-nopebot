import dotenv from 'dotenv'; dotenv.config();

import { ReplyToThread } from './send.js';

import { GenerateReplyToScam } from '../_openai/received.js';

import { GetGmail } from './init.js';
import { GetThreadData } from './inbox.js';

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

    //error message!
    if(email.content.includes("The response from the remote server was:"))
        return;

    if(!rawMessage || !rawMessage.data || !rawMessage.data.payload)
        throw "HandleLatestMessageInThread(): !rawMessage || !rawMessage.data || !rawMessage.data.payload";

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

    // messages.forEach(message => console.log(message));

    if(messages.length > 100){
        console.error("too many messages in thread: ", threadId);
        return;
    }

    //send the target's message to discord
    //but don't send a duplicate if this thread was created now
    if(data.ThreadExists())
        await thread.SendMessageInDiscordThread(messages[messages.length-1].content, await GetWebhookByName(process.env.WEBHOOK_TARGET));

    const url = await thread.GetLatestMessageDiscordURL();
    const msg = `Replied to ${url}!`;

    const result = await GenerateReplyToScam(messages);
    if(!result)
        throw "HandleLatestMessageInThread(): !result";

    //reply to the email
    await ReplyToThread(threadId, rawMessage, result);


    await DC_SendNormalMessage(msg);

    //send the reply to discord
    await thread.SendMessageInDiscordThread(result, await GetWebhookByName(process.env.WEBHOOK_SELF));
}