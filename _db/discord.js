
import { Model, DataTypes } from 'sequelize';
import { sequelize } from './associations.js';
import { Thread } from './thread.js';
import { GetDiscordClient } from '../_discord/main.js';
import { Delay } from '../_emails/utils.js';

const GUILD_IDS = process.env.GUILD_IDS.split(',');

let target_ids = undefined;
export async function GetTargetChannelIds()
{
    if(target_ids && GUILD_IDS.length === target_ids.length)
        return target_ids;

    target_ids = [];

    for(const id of GUILD_IDS){
        const dcGuild = await GetDiscordClient().guilds.fetch(id);

        if(!dcGuild){
            throw `GetTargetChannelIds(): !dcGuild (${id})`;
        }

        const dbGuild = await Guild.findOne({where: {guildId: id}});

        if(!dbGuild){
            throw `GetTargetChannelIds(): !dbGuild`;
        }

        const channel = await Channel.findOne({where: {guildId: dbGuild.id}});

        if(!channel){
            throw `GetTargetChannelIds(): !channel`;
        }

        target_ids.push(channel.channelId);
        console.log(`Cached ${target_ids.length} target channel(s)!`);
    }

    return target_ids;
}

export async function Guilds_Init()
{
    for(const id of GUILD_IDS){
        const dcGuild = await GetDiscordClient().guilds.fetch(id);

        if(!dcGuild){
            throw `Guilds_Init(): !dcGuild (${id})`;
        }

        let dbGuild = await Guild.findOne({where: {guildId: id}});

        if(!dbGuild){
            dbGuild = await Guild.create({guildId: id});
            console.log("Creating a new guild!");
        }

        await dbGuild.Init();
        console.log("Guild initialized!");
    }
}

export class Guild extends Model
{
    async Init()
    {
        const dbChannel = await this.CreateChannelIfNecessary();

        if(!dbChannel){
            throw `Guild::Init(): !dbChannel (${this.guildId})`;
        }
        
        if(!await dbChannel.GetWebhookByName(process.env.WEBHOOK_TARGET)){
            await dbChannel.CreateWebhook(process.env.WEBHOOK_TARGET);
        }

        if(!await dbChannel.GetWebhookByName(process.env.WEBHOOK_SELF)){
            await dbChannel.CreateWebhook(process.env.WEBHOOK_SELF);
        }

        console.log("Guild::Init() -> Success!");
    }

    async CreateChannelIfNecessary(){

        const dcGuild = await GetDiscordClient().guilds.fetch(this.guildId);

        if(!dcGuild){
            throw `Guild::CreateChannelIfNecessary(): !dcGuild (${this.guildId})`;
        }

        const channels = await dcGuild.channels.fetch(); // Fetch all channels

        let dcChannel = undefined; // Replace with the channel name

        channels.forEach(channel => {
            if (channel.name === process.env.CHANNEL_NAME) {
                dcChannel = channel;
            }
        });

        const dbChannel = await Channel.findOne({where: {guildId: this.id}});


        if(dcChannel && dbChannel)
            return dbChannel;

        //channel exists, but it's not in the database -> delete
        if(dcChannel && !dbChannel){
            console.log("Deleting the discord channel!");
            await dcChannel.delete();
            dcChannel = undefined;
        }

        if(!dcChannel){
            dcChannel = await dcGuild.channels.create({
                name: process.env.CHANNEL_NAME,
                autoArchiveDuration: 10080, //one week
                reason: "yep"
            });
            console.log("Creating a new channel!");

        }
        
        if(dbChannel)
            await Channel.destroy({where: {id: dbChannel.id}});

        return await Channel.create({
            guildId: this.id,
            channelId: dcChannel.id
        });

    }

    async Destructor()
    {
        const channels = await Channel.findAll({where: {guildId: this.id}});

        for(const channel of channels)
            await channel.Destructor();

        const webhooks = await GetWebhooks();

        webhooks.forEach(async (webhook) => {
            try {
                await webhook.delete();
                console.log(`Deleted webhook: ${webhook.name}`);
            } catch (error) {
                console.error(`Failed to delete webhook: ${webhook.name}`, error);
            }
        });

        await Thread.destroy({
            where: {}, 
            truncate: true
        });

        const dcGuild = await GetDiscordClient().guilds.fetch(this.guildId);

        if(!dcGuild){
            throw `Guild::Destructor(): !dcGuild (${this.guildId})`;
        }
        
        const dcChannel = await dcGuild.channels.cache.find(channel => channel.name === process.env.CHANNEL_NAME);
        if(dcChannel){
            await dcChannel.delete();
        }
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

        if(!channel)
            throw "Channel::Destructor(): !channel";

        const allthreads = await channel.threads.fetchActive();

        await allthreads.threads.forEach(async (thread) => {
            try {
              await thread.delete();
              console.log(`Deleted thread: ${thread.name}`);
            } catch (error) {
              console.error(`Failed to delete thread: ${thread.name}`, error);
            }
          });
          

    }

    async CreateNewThread(thread, title) {

        const discordThread = await DiscordThread.create({
            name: title,
            threadId: thread.id,
            channelId: this.id,
        });

        await discordThread.Init(this);
        return discordThread;
    }


    async GetThread(threadId)
    {
        const thread = await Thread.findOne({
            where: {
                threadId: threadId
            }
        });

        return thread;
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

// export class Discord extends Model
// {
//     static async Init()
//     {

//         const oldSize = await Discord.count();
//         for(const id of GUILD_IDS){

//             const guild = await Guild.findOne({where: {guildId: id}});

//             if(!guild)
//                 throw "Discord::Init(): !guild";

//             const discord = await Discord.findOne({where: {guildId: guild.id}});

//             if(!discord){
//                 await Discord.create({
//                     guildId: guild.id,
//                     personality: "a somewhat clueless person who speaks poor english - showing a lot of interest towards whatever they are offering"
//                 });
//                 console.log(`added a new guild: ${id}`);
//             }
//         }
        
//         if(oldSize !== await Discord.count());
//             console.log("Discord DB updated!");
        
//     }

//     static async Get(guild)
//     {
//         if(!(guild instanceof Guild))
//             throw "Discord::Get(): !(guild instance of Guild)";

//         return await Discord.findOne({where: { guildId: guild.id }});
//     }
    
//     async SetPersonality(personality)
//     {
//         if(typeof(personality) !== "string")
//             throw "Discord::SetPersonality(): typeof(personality) !== 'string'";

//         this.personality = personality;
//         await this.save();
//     }

//     async GetPersonality()
//     {
//         return this.personality;
//     }

// }

export class Discord extends Model
{
    static async Init()
    {
        if(await Discord.count() >= 1)
            return;

        await Discord.create({
                personality: "a somewhat clueless person who speaks poor english - showing a lot of interest towards whatever they are offering"
            });
        
        console.log("Discord DB initialized");
    }

    static async Get()
    {
        const table = await Discord.findOne({
            order: [['id', 'ASC']]
          });

        return table;
    }
    
    static async SetPersonality(personality)
    {
        const instance = await Discord.Get();

        if(!instance)
            throw "SetPersonality(): !instance";

        if(typeof(personality) !== "string")
            throw "SetPersonality(): typeof(personality) !== 'string'";

        instance.personality = personality;
        await instance.save();
    }

    static async GetPersonality()
    {
        const instance = await Discord.Get();

        if(!instance)
            throw "SetPersonality(): !instance";

        return instance.personality;
    }

}

export class DiscordThread extends Model
{

    async Init(channel)
    {
        const discordThread = await this.CreateThread(this.name);
        
        this.discordThreadId = discordThread.id;
        await this.save();

        const thread = await Thread.findByPk(this.threadId);

        if(!thread)
            throw "DiscordThread::Init(): !thread";

        const messages = await thread.GetMessages();

        for(const message of messages){

            const isMe = message.from.includes(process.env.EMAIL_ADDRESS);
            const webhookName = isMe ? process.env.WEBHOOK_SELF : process.env.WEBHOOK_TARGET;

            await this.SendMessageInThread(message.content, await channel.GetWebhookByName(webhookName));
            await Delay(2000);
        }
    }

    async CreateThread(threadName) {

        const dbChannel = await Channel.findByPk(this.channelId);

        if(!dbChannel)
            throw "Channel::CreateDiscordThread(): !dbChannel";

        const channel = await GetDiscordClient().channels.fetch(dbChannel.channelId);

        if(!channel)
            throw "Channel::CreateDiscordThread(): !channel";

        const thread = await channel.threads.create({
            name: threadName,
        });
        
        console.log(`Thread created! ID: ${thread.id}`);
        return thread;
    }

    async SendMessageInThread(text, webhook)
    {
        if(!webhook)
            throw "DiscordThread::SendMessageInThread(): !webhook";
        
        if(!this.discordThreadId)
            throw "DiscordThread::SendMessageInThread(): !discordThreadId";

        if(typeof(text) === "string" && text.length > 2000)
            text = text.substr(0, 2000);
    
        if(text.length === 0){
            console.error("Thread::SendMessageInThread(): text.length === 0");
            return;
        }
    
        await webhook.send({
            content: text, 
            threadId: this.discordThreadId
        });
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

        const dbChannel = await Channel.findByPk(this.channelId);

        if(!dbChannel)
            throw "Thread::GetLatestMessageFromDiscord(): !dbChannel";

        const channel = await GetDiscordClient().channels.fetch(dbChannel.channelId);

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

    async GetWebhookByName(name)
    {

        const channel = await Channel.findByPk(this.channelId);

        if(!(channel instanceof Channel))
            throw "DiscordThread::GetWebhookByName(): !(guild instanceof Guild)";

        return await channel.GetWebhookByName(name);
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

Discord.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        personality: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        // guildId: {
        //     type: DataTypes.INTEGER,
        //     allowNull: false,
        //     references: {
        //         model: Guild, 
        //         key: 'id' 
        //     }
        // }
    },
    {
        sequelize
    }
);

DiscordThread.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        discordThreadId: {
            type: DataTypes.STRING,
            allowNull: true,
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
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Thread, 
                key: 'id' 
            }
        }
    },
    {
        sequelize
    }
);

Guild.hasOne(Discord, { foreignKey: 'guildId', onDelete: 'CASCADE' });
Discord.belongsTo(Guild, { foreignKey: 'guildId' });

Guild.hasMany(Channel, { foreignKey: 'guildId', onDelete: 'CASCADE' });
Channel.belongsTo(Guild, { foreignKey: 'guildId' });

Thread.hasMany(DiscordThread, { foreignKey: 'threadId', onDelete: 'CASCADE' });
DiscordThread.belongsTo(Thread, { foreignKey: 'threadId' });