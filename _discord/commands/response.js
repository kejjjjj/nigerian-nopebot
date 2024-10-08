
import { isAdmin, SendMessage, SendFailureMessage, SendSuccessMessage } from './main.js';
import { Discord } from '../../_db/discord.js';

export async function DC_Personality(message, args)
{

    if((args?.length ?? 0) > 1)
        return SendFailureMessage(message, "Syntax Error", "Expected <new personality (optional)>");

    const count = args.length;

    if(count === 0){
        const instance = await Discord.GetPersonality();

        if(!instance)
            return SendFailureMessage(message, "Internal error", "Expression: !instance");


        return SendMessage(message, instance);
    }

    await Discord.SetPersonality(args[0]);
    return SendSuccessMessage(message, "Personality set!", args[0]);
}
