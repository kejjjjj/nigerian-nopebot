
import { Thread } from '../_db/thread.js';
import { DC_CreateThread, DC_GetThreadById } from '../_discord/threads.js';
import { GetWebhookByName } from '../_discord/utils.js';



export async function GetThreadFromDB(threadId)
{
    return await Thread.findOne({where: {threadId: threadId}});
}

export function Delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function CreateNewThread(threadId, email)
{
    const thread = await Thread.NewThread(threadId);

    if(!thread)
        throw "CreateNewThread(): !thread";

    await thread.SetSender(email.from);

    const discordThread = await DC_CreateThread(email.from);
    await thread.SetDiscordThreadId(discordThread.id);

    const messages = await thread.GetMessages();
    for(const message of messages){

        const isMe = message.from.includes(process.env.EMAIL_ADDRESS);
        const webhookName = isMe ? process.env.WEBHOOK_SELF : process.env.WEBHOOK_TARGET 
        await thread.SendMessageInDiscordThread(message.content, await GetWebhookByName(webhookName));
        await Delay(2000);
    }

    return thread;
}