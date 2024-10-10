
import { CreateNewThread } from './threads.js';
import { ReplyToThread } from './send.js';

import { GenerateReplyToScam } from '../_openai/received.js';

import { GetWebhookByName } from '../_discord/utils.js';

import { GetGmail } from './init.js';
import { GetThreadData } from './inbox.js';

export async function HandleLatestMessageInThread(threadId, rawMessage, email)
{
    const gmailThread = await GetGmail().users.threads.get({
        userId: 'me',
        id: threadId,
    });

    const data = await GetThreadData(gmailThread);

    if(!data)
        return;

    if(!await data.NeedsResponse()){
        console.log("no response needed");
        return;
    }

    console.log("response needed!");

    const thread = data.ThreadExists() ? data.thread : await CreateNewThread(threadId, email);

    if(!thread)
        throw "HandleLatestMessageInThread(): !thread";

    const messages = await thread.GetMessages();
    // messages.forEach(message => console.log(message));

    if(messages.length > 100){
        console.error("too many messages in thread: ", threadId);
        return;
    }


    //send the target's message to discord
    //but don't send a duplicate if this thread was created now
    if(data.ThreadExists())
        await thread.SendMessageInDiscordThread(email.content, await GetWebhookByName(process.env.WEBHOOK_TARGET));

    const result = await GenerateReplyToScam(messages);
    if(!result)
        throw "HandleLatestMessageInThread(): !result";

    //reply to the email
    await ReplyToThread(threadId, rawMessage, result);

    //send the reply to discord
    await thread.SendMessageInDiscordThread(result, await GetWebhookByName(process.env.WEBHOOK_SELF));
}