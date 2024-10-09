
import { Model, DataTypes } from 'sequelize';
import { sequelize } from './associations.js';

import { DC_GetThreadById } from '../_discord/threads.js';
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

        //so that it's in a logical order :)
        //0 being the oldest
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
            throw "SendMessageInThread(): !webhook";
        
        if(!this.discordThreadId)
            throw "SendMessageInThread(): !discordThreadId";

        // const dcThread = await DC_GetThreadById(this.discordThreadId);

        // if(!dcThread)
        //     throw "SendMessageInThread(): !dcThread";

        if(typeof(text) === "string" && text.length > 2000)
            text = text.substr(0, 2000);
    
        if(text.length === 0){
            console.error("SendMessageInDiscordThread(): text.length === 0");
            return;
        }
    
        await webhook.send({
            content: text, 
            threadId: this.discordThreadId
        });

        //await dcThread.send(text);
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
