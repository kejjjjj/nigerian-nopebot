
import { GetThreadFromDB } from './threads.js';
import { ReplyToThread } from './send.js';
import { CleanEmailBody } from './utils.js';

import { IsScamEmail, GenerateReplyToScam } from '../_openai/received.js';
import { Thread } from '../_db/thread.js';
import { DC_CreateThread, DC_GetThreadById } from '../_discord/threads.js';

import { GetWebhookByName, CreateWebhook } from '../_discord/utils.js';

import { GetGmail } from './init.js';

export async function OnEmailReceived(email, id, threadId)
{
    let thread = await GetThreadFromDB(threadId); 
    const content = email.content;

    if(!thread){
        console.log("this thread does NOT exist yet");

        //bye if you're not spam
        if(!await IsScamEmail(content)){
            console.log("not spam!");
            return false;
        }

        console.log("is spam!");
        thread = await Thread.NewThread(threadId);
        await thread.SetSender(email.from);

        const discordThread = await DC_CreateThread(email.from);

        await thread.SetDiscordThreadId(discordThread.id);

    } else{
        console.log("this thread exists :)");
    }

    const messages = await thread.GetMessages();

    if(messages.length > 50){
        console.error("too many messages in thread: ", threadId);
        return;
    }


    //send the target's message to discord
    await thread.SendMessageInDiscordThread(content, await GetWebhookByName("Enemy"));
    const result = await GenerateReplyToScam(messages);
    
    const message = await GetGmail().users.messages.get({ userId: 'me', id: id });

    if(!message)
        throw "OnEmailReceived(): !message";

    //reply to the email
    await ReplyToThread(threadId, message, result);

    //send the reply to discord
    await thread.SendMessageInDiscordThread(result, await GetWebhookByName("Seppo Varjus"));
}