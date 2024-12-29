import dotenv from 'dotenv'; dotenv.config();

import { GetGmail } from './init.js';
import { ConvertMessageClean, Delay, HasMoreThanAWeekPassedSinceMessage } from './utils.js';
import { GetThreadFromDB } from './threads.js';
import { HandleLatestMessageInThread } from './received.js';

import { Thread } from '../_db/thread.js';
import { Guild } from '../_db/discord.js';

import { IsScamEmail } from '../_openai/received.js';

import { DC_SendNormalMessage } from '../_discord/commands/main.js';

import { threadQueue } from './queue.js';

function MessageWasSentByMe(message)
{
    const headers = message?.data?.payload?.headers;
    
    if(!headers)
        return false;

    //check if any header indicates it's from you
    const isFromYou = headers.some(header => header.name === 'From' && header.value.includes(process.env.EMAIL_ADDRESS));
    
    return isFromYou;
}


export async function GetThreadData(threadObj)
{

    //some idiot passed undefined
    if(!threadObj?.data?.messages){
        console.error("GetThreadData(): !threadObj?.data?.messages");
        return undefined;
    }

    const messages = threadObj?.data?.messages || [];

    //no messages in a thread?!
    if(!messages || (messages?.length ?? 0) < 1)
        return undefined;

    const thread = await GetThreadFromDB(threadObj.data.id);

    const latestMessageBody = await ConvertMessageClean(messages[messages.length - 1]);
    const initialMessage = await ConvertMessageClean(messages[0]);

    if(!latestMessageBody || !initialMessage)
        return undefined;

    const latestMessageWasByMe = latestMessageBody.from.includes(process.env.EMAIL_ADDRESS);

    return {
        thread,
        latestMessageWasByMe,
        latestMessageBody,
        initialMessage,
        moreThanWeekPassed,
        ThreadExists() { return !!this.thread; },
        
        async NeedsResponse() {
            
            this.moreThanWeekPassed = HasMoreThanAWeekPassedSinceMessage(messages[messages.length - 1]);
            if(!this.moreThanWeekPassed && this.latestMessageWasByMe)
                return false;

            if(this.ThreadExists())
                return true;

            return await IsScamEmail(this.initialMessage.content);
        }
        

    };
}


export async function GoThroughLastNumThreadsInInbox(count)
{

    count = Math.max( Math.max(0, count), Math.min(500, count) );

    if(!count)
        return;

    const gmail = GetGmail();
    const res = await gmail.users.threads.list({
        userId: 'me',
        maxResults: count,
    });

    const threads = res.data.threads || [];

    const guildCount = await Guild.count();

    await DC_SendNormalMessage(`Going through the last ${threads.length} threads!\nEstimated time: ${(threads.length * 5 / 60 * guildCount).toFixed(1)} minutes`);

    threads.forEach(thread => threadQueue.AddThread(thread.id));

    try{
        if(!threadQueue.IsActive())
            await threadQueue.ProcessEntireQueue();

    }catch(ex){
        console.error("Error: ", ex);
        return;
    }

    await Delay(2000);
    if(!threadQueue.IsActive())
        await DC_SendNormalMessage(`Finished!`);

}

export async function ProcessThread(threadId)
{
    const gmail = GetGmail();

    const thread = await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
    });

    if(!thread || !thread.data.messages){
        await DC_SendNormalMessage(`No messages in thread: ${thread.data.id}!`);
        return;
    }

    const latestMessage = thread.data.messages[0];
    const data = await ConvertMessageClean(latestMessage);

    if(!data){
        console.error("received bad data, ignoring...");
        return;
    }

    const obj = { data: { ...latestMessage } };
    await HandleLatestMessageInThread(thread, obj, data);
}