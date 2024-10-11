
import { isAdmin, SendMessage, SendFailureMessage, SendSuccessMessage } from './main.js';
import { Discord } from '../../_db/discord.js';

import { GoThroughLastNumThreadsInInbox } from '../../_emails/inbox.js';

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

export async function DC_Dig(message, args)
{

    if((args?.length ?? 0) !== 1)
        return SendFailureMessage(message, "Syntax Error", "Expected <count>");

    const [ count ] = args;

    if(!Number.isInteger(+count))
        return SendFailureMessage(message, "Error", `${count} is not an integer`);

    if(+count < 1)
        return SendFailureMessage(message, "Error", `must be > 0`);

    await GoThroughLastNumThreadsInInbox(count);
}

