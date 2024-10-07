import dotenv from 'dotenv'; dotenv.config();
import OpenAI from "openai";


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

function GenerateQueriesFromContext(context)
{


    if(!context || (context?.length ?? 0) < 1)
        throw "!context || (context?.length ?? 0) < 1";

    console.log("context.length: ", context.length);

    if(context.length % 2 == 0)
        throw "context.length % 2 == 0";

    const systemText = "This email is a scam, reply to it like a very clueless person who speaks poor english - showing a lot of interest towards whatever they are offering";
    const preText = "Your name is Seppo Varjus. Reply to this email: ";

    const systemInput = { role: "system",  content: systemText };

    if(context.length === 1){
        const prompt = preText + context[0].content;
        const userInput = { role: "user",  content: prompt };

        return [ systemInput, userInput ];
    }

    if(context.length < 3) //assumes -> target, self, target
        throw "context.length < 3";

    //initial message for context 
    const firstMessage = { role: "user",  content: context[0].content };
    
    //what the target said now
    const prompt = preText + context[context.length - 1].content;
    const lastMessage = { role: "user", content: prompt };

    //what the ai sent previously
    const myMessage = { role: "assistant",  content: context[context.length - 2].content };
    
    return [ systemInput, firstMessage, myMessage, lastMessage ];
}

export async function GenerateReplyToScam(context)
{

    const msgs = GenerateQueriesFromContext(context);

    console.log("context: ");
    msgs.forEach(msg => console.log(msg));

    const openAI = GetOpenAI();
    const completion = await openAI.chat.completions.create({
        model: "gpt-4o-mini",
        messages: msgs,
    });

    const str = completion?.choices[0]?.message?.content;

    if(!str)
        throw "GenerateReplyToScam(): !str";

    return str;
}