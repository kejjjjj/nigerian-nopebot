
import { google } from 'googleapis';
import { ConvertMessageClean } from './utils.js';

import { GetAccessToken, GetAuth, GetGmail } from './init.js';

import { OnEmailReceived } from './received.js';

let lastMessageId = null;  // Store the last message ID you've processed

async function ListCallback(err, res)
{
    try{
        
        if (err) 
            throw err;



        const latestMessage = res.data.messages[0];
        if (latestMessage.id !== lastMessageId) {

            if(!lastMessageId){
                lastMessageId = latestMessage.id;
                console.log('Ignoring first poll.');
                return;
            }

            lastMessageId = latestMessage.id;
            console.log('New email received:', latestMessage);

            // Fetch the new email details
            GetGmail().users.messages.get({
                userId: 'me',
                id: latestMessage.id,
            }, async (err, res) => {
                if (err) 
                    throw err;
                    
                try{
                    const data = await ConvertMessageClean(res.data);

                    if(!data){
                        console.error("received bad data, ignoring...");
                        return;
                    }

                    return await OnEmailReceived(data, latestMessage.id, latestMessage.threadId);
                }catch(ex){
                    console.error("Email parsing failure: ", ex);
                    return;
                }
                
            });        
        } else {
            // console.log('No new emails.');
        }
    }catch(ex){
        console.error("ListCallback(): ", ex);

    }

}

export async function PollEmails(auth)
{
    try{
        await GetAccessToken();

        GetGmail().users.messages.list({
            userId: 'me',
            labelIds: ['INBOX'],
            maxResults: 1,  // Fetch the latest message
        }, ListCallback);

    }catch(ex){
        console.error("PollEmails(): ", ex);
    }

}