import dotenv from 'dotenv'; dotenv.config();

import { GetGmail } from './init.js';
import { ConvertMessageClean } from './utils.js';
import { GetThreadFromDB } from './threads.js';

import { Thread } from '../_db/thread.js';

import { IsScamEmail } from '../_openai/received.js';

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
    if(!threadObj)
        return undefined;

    const messages = threadObj.data.messages || [];

    //no messages in a thread?!
    if((messages?.length ?? 0) < 1)
        return undefined;

    const messageRes = await GetGmail().users.messages.get({
        userId: 'me',
        id: messages[0].id, //latest message
        format: 'full'
    });

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

        ThreadExists() { return !!this.thread; },
        
        async NeedsResponse() {
            
            if(this.latestMessageWasByMe)
                return false;

            if(this.ThreadExists())
                return true;

            return await IsScamEmail(this.initialMessage.content);
        }
        

    };
}