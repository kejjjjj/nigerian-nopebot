
import { Model, DataTypes } from 'sequelize';
import { sequelize } from './associations.js';

import { ConvertMessageClean } from '../_emails/utils.js';

export class Thread extends Model
{
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

    async GetAllDiscordThreads()
    {
        const { DiscordThread } = await import('./discord.js');
        return await DiscordThread.findAll({where: {threadId: this.id}});
    }

    async SetSender(sender){
        this.from = sender;
        await this.save();
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
        from: {
            type: DataTypes.STRING,
        }
    },
    {
        sequelize
    }
);