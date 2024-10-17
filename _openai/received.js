import dotenv from 'dotenv'; dotenv.config();
import OpenAI from "openai";

import { Discord } from '../_db/discord.js';

import { CleanRoleplay } from '../_emails/utils.js';

let openai = undefined;

function GetOpenAI()
{
    if(!openai){
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    return openai;
}

export async function IsScamEmail(body)
{

    const systemText = "You can only respond to prompts with either Yes or No. Your response will be programatically parsed, so it has to be as expected.";
    const preText = "Tell me if this message is a scam email: ";

    const prompt = preText + body;

    try{

        const openAI = GetOpenAI();

        const completion = await openAI.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemText },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const str = completion?.choices[0]?.message?.content;

        if(!str)
            throw "!str";

        const correctLength = str.length > 0 && str.length < 5;
        const hasYes = str.toLowerCase().includes("yes");
        
        return correctLength && hasYes;

    }catch(ex){
        console.error("IsScamEmail(): ", ex);
        return undefined;
    }

}

function GetMyLatestMessage(messages)
{
    let latest = undefined;

    for(const message of messages){
        if(message.from.includes(process.env.EMAIL_ADDRESS))
            latest = message;
    }

    return latest;
}

function GetAllScammerMessages(messages)
{
    let msgs = [];

    for(const message of messages){
        if(!message.from.includes(process.env.EMAIL_ADDRESS))
            msgs.push(message);
    }

    return msgs;
}

function GenerateQueriesFromContextAndPersonality(context, personality)
{


    if(!context || (context?.length ?? 0) < 1)
        throw "!context || (context?.length ?? 0) < 1";

    // console.log("context.length: ", context.length);

    const systemText = 
    `Your name is ${process.env.WHO_AM_I}.
    This is your personality: '${personality}'.
    You will never get sidetracked by unrelated questions - you will always try to force the recipient to stay in the topic (the first message),
    but you will still prioritize the most recent message.`;

    const systemInput = { role: "system",  content: systemText };

    // if(context.length === 1){
    //     const prompt = "Scammer: " + context[0].content;
    //     const userInput = { role: "user",  content: prompt };

    //     return [ systemInput, userInput ];
    // }

    const userInputs = GenerateQueriesFromContext(context);
    return [ systemInput, ...userInputs ];

    // const scammerMessages = GetAllScammerMessages(context);

    // if(!scammerMessages || scammerMessages.length < 1)
    //     throw "!scammerMessages || scammerMessages.length < 1";

    // //initial message for context 
    // const firstPrompt = "Scammer: " + scammerMessages[0].content;
    // const firstMessage = { role: "user",  content: firstPrompt };
    
    // if(scammerMessages.length === 1)
    //     return [ systemInput, firstMessage ];

    // //what the target said now
    // const prompt = "Scammer: " + scammerMessages[scammerMessages.length - 1].content;
    // const lastMessage = { role: "user", content: prompt };

    // //what the ai sent previously
    // const myMessageObj = GetMyLatestMessage(context);

    // if(!myMessageObj){
    //     return [ systemInput, firstMessage, lastMessage ];
    // }

    // const myPrompt = "Me: " + myMessageObj.content;
    // const myMessage = { role: "assistant",  content: myPrompt };
    
    // return [ systemInput, firstMessage, myMessage, lastMessage ];
}
function GenerateQueriesFromContext(context)
{
    const queries = [];

    for(const part of context){
        const isMe = part.from.includes(process.env.EMAIL_ADDRESS);

        const who = isMe ? "Me" : "Scammer";
        const role = isMe ? "assistant" : "user";

        const prompt = `${who}: ` + part.content;

        const message = { role: role, content: prompt };
        queries.push(message);
    }

    return queries;

}
function replaceWordCaseInsensitive(text, target, replacement) {
    const regex = new RegExp(target, 'gi');
    return text.replace(regex, replacement);
}
export async function GenerateReplyToScam(context)
{

    const personality = await Discord.GetPersonality();

    if(!personality)
        throw "GenerateReplyToScam(): !personality";

    const msgs = GenerateQueriesFromContextAndPersonality(context, personality);

    // console.log("context: ");
    // msgs.forEach(msg => console.log(msg));

    const openAI = GetOpenAI();
    const completion = await openAI.chat.completions.create({
        model: "gpt-4o-mini",
        messages: msgs,
    });

    const str = completion?.choices[0]?.message?.content;

    if(!str)
        throw "GenerateReplyToScam(): !str";

    return replaceWordCaseInsensitive(CleanRoleplay(str), "scammer", "friend");
}