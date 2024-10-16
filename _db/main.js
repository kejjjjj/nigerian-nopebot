
import { sequelize } from './associations.js';
import { Guild } from './discord.js';
import { GetDiscordClient } from '../_discord/main.js';


export async function DeleteEverything()
{
    const guilds = await Guild.findAll();

    for(const guild of guilds){
        await guild.Destructor();   
    }

    await sequelize.sync({force: true});

    console.log("everything has been erased");
}
