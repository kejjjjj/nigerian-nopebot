
import { sequelize } from './associations.js';
import { Guild, Channel, Thread } from './thread.js';
import { GetDiscordClient } from '../_discord/main.js';

export async function DeleteAllDiscordContent()
{
    const channel = await GetDiscordClient().channels.fetch(process.env.CHANNEL_ID);
    const allthreads = await channel.threads.fetchActive();

    allthreads.threads.forEach(async (thread) => {
        try {
          await thread.delete();
          console.log(`Deleted thread: ${thread.name}`);
        } catch (error) {
          console.error(`Failed to delete thread: ${thread.name}`, error);
        }
      });
      
    console.log("threads have been erased");

    const guild = await GetDiscordClient().guilds.fetch(process.env.GUILD_IDS);

    if(!guild)
        throw "Guild::GetWebhooks(): !guild";

    const webhooks = await guild.fetchWebhooks();

    webhooks.forEach(async (webhook) => {
        try {
          await webhook.delete();
          console.log(`Deleted webhook: ${webhook.name}`);
        } catch (error) {
          console.error(`Failed to delete webhook: ${webhook.name}`, error);
        }
      });
}


export async function DeleteEverything()
{
    const guilds = await Guild.findAll();

    for(const guild of guilds){
        await guild.Destructor();   
    }

    await sequelize.sync({force: true});

    console.log("everything has been erased");
}
