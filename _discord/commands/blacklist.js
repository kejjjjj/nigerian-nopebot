
import { isAdmin, SendMessage, SendFailureMessage, SendSuccessMessage } from './main.js';
import { Discord, Guild } from '../../_db/discord.js';

import { Blacklist } from '../../_db/blacklist.js';

export async function DC_BlockString(message, args)
{
    if(args?.length !== 1)
        return SendFailureMessage(message, "Syntax Error", "Expected <string to block>");

    if(await Blacklist.IsBlockedString(args[0]))
        return SendFailureMessage(message, "Failure", "This string is already blacklisted");

    await Blacklist.BlockString(args[0]);
    return SendSuccessMessage(message, "Blocked!", args[0]);
}
export async function DC_UnblockString(message, args)
{
    if(args?.length !== 1)
        return SendFailureMessage(message, "Syntax Error", "Expected <string to whitelist>");

    if(!await Blacklist.IsBlockedString(args[0]))
        return SendFailureMessage(message, "Failure", "This string is not blacklisted");

    await Blacklist.UnblockString(args[0]);
    return SendSuccessMessage(message, "Removed!", args[0]);
}
export async function DC_GetBlocked(message, args)
{
    if(args?.length !== 0)
        return SendFailureMessage(message, "Syntax Error", "Didn't expect arguments");

    const all = await Blacklist.findAll();

    let str = "";
    all.forEach(blacklist => { str += blacklist.blockedString + '\n'; });

    if(str.length < 1)
        return SendFailureMessage(message, "Internal Error", "str.length < 1");

    return SendSuccessMessage(message, "All blacklisted strings", str);
}

