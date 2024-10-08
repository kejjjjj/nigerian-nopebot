import dotenv from 'dotenv'; dotenv.config();

export async function ConvertMessageClean(message) {
    return new Promise((resolve, reject) => {

        const headers = message.payload.headers || [];

        let body = '';

        const subject = headers.find(header => header.name === 'Subject')?.value || 'No Subject';
        const from = headers.find(header => header.name === 'From')?.value || 'Unknown Sender';
        const to = headers.find(header => header.name === 'To')?.value || 'Unknown Recipient';
        const date = headers.find(header => header.name === 'Date')?.value || 'Unknown Date';

        const parts = message.payload.parts || [];

        if (parts.length > 0) {
            parts.forEach((part) => {
                if (part.mimeType === 'text/plain') {
                    body += Buffer.from(part.body.data, 'base64').toString('utf-8'); // Plain text part
                }
            });
        }

        if (!body.length && message.payload.body?.data) {
            body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
        }

        if(!subject?.length && !body?.length)
            return reject("!subject?.length && !body?.length");


        const newbody = CleanEmailBody(body.trim());
        body = newbody.length > 0 ? newbody : body;

        if(body.length === 0){
            return reject("body.length === 0");
        }

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
    return body.split(/On .* wrote:/)[0].trim();
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