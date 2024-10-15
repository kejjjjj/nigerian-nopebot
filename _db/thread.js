
import { Model, DataTypes } from 'sequelize';
import { sequelize } from './associations.js';

import { DC_GetThreadById } from '../_discord/threads.js';
import { GetDiscordClient } from '../_discord/main.js';

import { ConvertMessageClean } from '../_emails/utils.js';

import { Delay } from '../_emails/utils.js';

export class Guild extends Model
{
    async Destructor()
    {
        const channels = await Channel.findAll({where: {guildId: this.id}});

        for(const channel of channels)
            await channel.Destructor();

        const webhooks = await GetWebhooks();
        for(const webhook of webhooks)
            await webhook.delete();
    }

    async GetWebhooks()
    {
        const guild = await GetDiscordClient().guilds.fetch(this.guildId);

        if(!guild)
            throw "Guild::GetWebhooks(): !guild";

        return await guild.fetchWebhooks();
    }
    async GetWebhookByName(name)
    {
        const webhooks = await this.GetWebhooks();
        return webhooks.find(webhook => webhook.name === name);
    }
}

export class Channel extends Model
{
    async Destructor()
    {
        const channel = await GetDiscordClient().channels.fetch(this.channelId);
        const threads = await channel.threads.fetch();
        for(const thread of threads){
            await thread.delete();
        }

        await Thread.destroy({
            where: {
                channelId: this.id
            }, 
            truncate: true
        });
    }

    async CreateDiscordThread(threadName) {

        const channel = await GetDiscordClient().channels.fetch(this.channelId);

        if(!channel)
            throw "Channel::CreateDiscordThread(): !channel";

        const thread = await channel.threads.create({
            name: threadName,
        });
        
        console.log(`Thread created! ID: ${thread.id}`);
        return thread;
    }

    async CreateNewThread(threadId, title) {

        const thread = await this.NewThread(threadId);

        if(!thread)
            throw "Channel::CreateNewThread(): !thread";

        await thread.SetSender(title);

        const discordThread = await this.CreateDiscordThread(title);
        await thread.SetDiscordThreadId(discordThread.id);

        const messages = await thread.GetMessages();

        for(const message of messages){

            const isMe = message.from.includes(process.env.EMAIL_ADDRESS);
            const webhookName = isMe ? process.env.WEBHOOK_SELF : process.env.WEBHOOK_TARGET;

            await thread.SendMessageInDiscordThread(message.content, await this.GetWebhookByName(webhookName));
            await Delay(2000);
        }

        return thread;
    }

    async NewThread(threadId){

        if(await GetThread(threadId))
            throw `Channel::NewThread(): the thread ${threadId} already exists!`;

        return await Thread.create({
            channelId: this.id,
            threadId: threadId
        });
    }

    async GetThread(threadId)
    {
        const thread = await Thread.findOne({
            where: {
                channelId: this.id, 
                threadId: threadId
            }
        });

        return thread;
    }

    async GetThreads()
    {
        return await Thread.findAll({where: { channelId: this.id} });
    }
    async GetWebhookByName(name)
    {
        const guild = await Guild.findByPk(this.guildId);

        if(!(guild instanceof Guild))
            throw "Channel::GetWebhookByName(): !(guild instanceof Guild)";

        return await guild.GetWebhookByName(name);
    }
    async CreateWebhook(name)
    {
        const old = await this.GetWebhookByName(name);

        if(old)
            return old;
        
        const channel = await GetDiscordClient().channels.fetch(this.channelId);

        if(!channel)
            throw "Channel::CreateWebhook(): !channel";

        const webhook = await channel.createWebhook({
            name: name
        });
        
        console.log(`Webhook created! Name: ${webhook.name}, URL: ${webhook.url}`);
        return webhook;
    }
}


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
        const dbchannel = await Channel.findByPk(this.channelId);
        
        if(!dbchannel)
            throw "Thread::GetLatestMessageFromDiscord(): !dbchannel";

        const dbguild = await Guild.findByPk(dbchannel.guildId);

        if(!dbguild)
            throw "Thread::GetLatestMessageFromDiscord(): !dbguild";

        const guild = await GetDiscordClient().guilds.fetch(dbguild.guildId);
    
        if(!guild)
            throw "Thread::GetLatestMessageFromDiscord(): !guild";

        const channel = await GetDiscordClient().channels.fetch(this.channelId);

        if(!channel)
            throw "Thread::GetLatestMessageFromDiscord(): !channel";

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



Guild.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        guildId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize
    }
);

Channel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        channelId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        guildId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Guild, 
                key: 'id' 
            }
        },
    },
    {
        sequelize
    }
);

Thread.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        channelId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Channel, 
                key: 'id' 
            }
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

Guild.hasMany(Channel, { foreignKey: 'guildId', onDelete: 'CASCADE' });
Channel.belongsTo(Guild, { foreignKey: 'guildId' });

Channel.hasMany(Thread, { foreignKey: 'channelId', onDelete: 'CASCADE' });
Thread.belongsTo(Channel, { foreignKey: 'channelId' });