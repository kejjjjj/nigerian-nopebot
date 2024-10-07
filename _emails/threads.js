
import { Thread } from '../_db/thread.js';



export async function GetThreadFromDB(threadId)
{
    return await Thread.findOne({where: {threadId: threadId}});
}
