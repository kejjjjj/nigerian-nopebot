
import { FormatEmailReply } from './utils.js';
import { GetGmail } from './init.js';

export async function ReplyToThread(threadId, message, content)
{  
    const gmail = GetGmail();
    const email = FormatEmailReply(message, content); // format as RFC 2822 string
  
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: email,
        threadId,
      },
    });
  
    console.log(`Reply sent! Message Id: ${res.data.id}`);

}