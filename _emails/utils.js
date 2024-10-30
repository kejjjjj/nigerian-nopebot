import dotenv from 'dotenv'; dotenv.config();

export function CleanRoleplay(message) {
    return message.replace(/^(me:\s*)+/i, '').trim();
}
export function Delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export async function ConvertMessageClean(message) {
    return new Promise((resolve, reject) => {

        if(!message || !message.payload)
            return reject("!message || !message.payload");

        const headers = message.payload.headers || [];

        let body = '';

        const subject = headers.find(header => header.name === 'Subject')?.value || 'No Subject';
        const from = headers.find(header => header.name === 'From')?.value || 'Unknown Sender';
        const to = headers.find(header => header.name === 'To')?.value || 'Unknown Recipient';
        const date = headers.find(header => header.name === 'Date')?.value || 'Unknown Date';

        const parts = message.payload.parts || [];

        if (parts.length > 0) {
            parts.forEach((part) => {
                if (part.mimeType === 'text/plain' && part.body?.data) {
                    const decodedPart = Buffer.from(part.body.data, 'base64').toString('utf-8');
                    if (decodedPart.trim().length > 0) {
                        body += decodedPart; // Append non-empty decoded part
                    }
                }
            });
        }

        // If no valid part found, fallback to the main body
        if (!body.length && message.payload.body?.data) {
            const decodedMainBody = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
            body = decodedMainBody.trim(); // Trim the decoded body
        }


        if(!subject?.length && !body?.length)
            return reject("!subject?.length && !body?.length");

        const newbody = CleanEmailBody(body.trim());
        body = newbody.length > 0 ? newbody : body;

        // if(body.length === 0){
        //     return reject("body.length === 0");
        // }

        body = CleanRoleplay(body);

        return resolve({
            subject: subject,
            from: from,
            to: to,
            date: date,
            content: body
        });

    });
}

export function CleanEmailBody(body) {
    const data = body.split(/On .* wrote:/)[0].trim();
    return data.length > 0 ? data : body;
}

export function FormatEmail(to, subject, message) {

    const emailLines = [
        `From: ${process.env.EMAIL_ADDRESS}`,
        `To: ${to}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        `${message}` 
    ];

    const email = emailLines.join('\r\n').trim();
    const base64Email = Buffer.from(email).toString('base64');

    return base64Email;
}

export function FormatEmailReply(message, content) {
    const emailLines = [
        `From: ${process.env.EMAIL_ADDRESS}`,
        `To: ${message.data.payload.headers.find(h => h.name === 'From').value}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        `Subject: Re: ${message.data.payload.headers.find(h => h.name === 'Subject').value}`,
        '',
        `${content}` 
    ];

    const email = emailLines.join('\r\n').trim();
    const base64Email = Buffer.from(email).toString('base64');

    return base64Email;
}

export function GetMessageTimestamp(message)
{
    return message?.internalDate || 0;
}
export function HasMoreThanAWeekPassedSinceMessage(message) {

    const latestTimestamp = GetMessageTimestamp(message);

    console.log(latestTimestamp);

    if(!latestTimestamp)
        return false;

    const oneWeekInMillis = 7 * 24 * 60 * 60 * 1000; 
    const currentTime = Date.now(); 
    
    return (currentTime -  latestTimestamp) > oneWeekInMillis;
}