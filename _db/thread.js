
import { Model, DataTypes } from 'sequelize';
import { sequelize } from './associations.js';

import { DC_GetThreadById } from '../_discord/threads.js';
import { GetDiscordClient } from '../_discord/main.js';

import { ConvertMessageClean } from '../_emails/utils.js';

export class Thread extends Model
{

    static async NewThread(threadId){

        if(await Thread.findOne({where: {threadId: threadId}}))
            throw `the thread ${threadId} already exists!`;

        return await Thread.create({threadId: threadId});
    }

    async GetMessages()
    {
        const { GetGmail } = await import('../_emails/init.js');

        const res = await GetGmail().users.threads.get({
            userId: 'me',
            id: this.threadId,
        });

        const messages = res.data.messages || [];

        let results = [];

        for(const message of messages){
            const cleanMessage = await ConvertMessageClean(message);
            
            if(cleanMessage)
                results.push(cleanMessage);
            else
                console.error("BAD MESSAGE");

        }

        return results;
    }

    async SetDiscordThreadId(id){
        this.discordThreadId = id;
        await this.save();
    }

    async SetSender(sender){
        this.from = sender;
        await this.save();
    }

    async SendMessageInDiscordThread(text, webhook)
    {
        if(!webhook)
            throw "Thread::SendMessageInThread(): !webhook";
        
        if(!this.discordThreadId)
            throw "Thread::SendMessageInThread(): !discordThreadId";

        // const dcThread = await DC_GetThreadById(this.discordThreadId);

        // if(!dcThread)
        //     throw "SendMessageInThread(): !dcThread";

        if(typeof(text) === "string" && text.length > 2000)
            text = text.substr(0, 2000);
    
        if(text.length === 0){
            console.error("Thread::SendMessageInDiscordThread(): text.length === 0");
            return;
        }
    
        await webhook.send({
            content: text, 
            threadId: this.discordThreadId
        });

        //await dcThread.send(text);
    }

    async GetLatestMessageDiscordURL()
    {
        const guild = await GetDiscordClient().guilds.fetch(process.env.GUILD_ID);
    
        if(!guild)
            throw "Thread::GetLatestMessageFromDiscord(): !guild";

        const channel = await GetDiscordClient().channels.fetch(process.env.CHANNEL_ID);
        const thread = channel.threads.cache.find(x => x.id === this.discordThreadId);

        if(!thread)
            throw "Thread::GetLatestMessageFromDiscord(): !thread";

        const messages = await thread.messages.fetch({ limit: 1 });

        if(!messages || messages.length < 1)
            return undefined;

        const messageUrl = `https://discord.com/channels/${guild.id}/${thread.id}/${messages.first().id}`;
        return messageUrl;
    }

}   

Thread.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        threadId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        discordThreadId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        from: {
            type: DataTypes.STRING,
        }
    },
    {
        sequelize
    }
);
