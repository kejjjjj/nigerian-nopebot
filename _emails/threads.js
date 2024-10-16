
import { Thread } from '../_db/thread.js';
import { Guild, Channel } from '../_db/discord.js';

export async function GetThreadFromDB(threadId)
{
    return await Thread.findOne({where: {threadId: threadId}});
}

export async function CreateNewThread(threadId, email)
{
    
    if(await Thread.findOne({where: {threadId: threadId}}))
        throw `CreateNewThread(): the thread ${threadId} already exists!`;


    const thread = await Thread.create({ threadId: threadId, from: email.from });

    if(!thread)
        throw "CreateNewThread(): !thread";

    //Discord stuff!
    const allGuilds = await Guild.findAll();
    for(const guild of allGuilds){
        const channel = await Channel.findOne({where: { guildId: guild.id }});

        if(!channel)
            throw "CreateNewThread(): !channel";
    
        await channel.CreateNewThread(thread, thread.from);
    }



    return thread;
}