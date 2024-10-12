# Nigerian-Nope-Bot Documentation (Written by ChatGPT!)

## Overview

#### The **Nigerian-Nope-Bot** is a tool that utilizes Gmail and OpenAI APIs to automatically respond to scam emails. This bot is controlled through a Discord bot, allowing users to manage configurations and responses directly from Discord. The bot scans your Gmail inbox for potential scam emails and replies with custom personalities, giving you a humorous and creative way to engage with scammers.
---

## Prerequisites

- **Google Account**: You’ll need access to a Gmail account with IMAP enabled (use a burner account to avoid getting banned).
- **Gmail API Access**: Set up and configure your Gmail API credentials.
- **OpenAI API Key**: Generate an API key from your OpenAI account to access GPT models.
- **Discord Account & Bot**: Set up a Discord bot with the required permissions to communicate with the bot.

#### All configuration, including managing personalities, and email responses, is handled via the Discord bot.
---

## Limitations

- **False Positives**: The bot might occasionally flag legitimate emails as scams. It’s important to fine-tune your filter criteria to reduce false positives.

---

## Security Considerations

- **Scam Content**: The bot is meant for interacting with scam emails in a harmless, fun manner. Do not use this bot to engage in illegal activities like phishing or impersonation.
- **Email Privacy**: The bot reads and responds to emails automatically.


## Required Environment Variables:

WHO_AM_I= # who is responding to the emails\
CLIENT_ID= # google client id\
CLIENT_SECRET= # google client secret\
REFRESH_TOKEN= # google refresh token\
EMAIL_ADDRESS= # our email address\
DISCORD_BOT_TOKEN= self explanatory\
CHANNEL_ID = # where the discord threads get created\
GUILD_ID = # the server, that has the bot\
OPENAI_API_KEY= # self explanatory\
COMMAND_ACTIVATION_CHANNELS= # comma separated list of channels where the discord bot will respond\
DISCORD_ADMINS= # comma separated list of users who can use the bot's admin commands\
WEBHOOK_SELF= # this client's name for the webhook\
WEBHOOK_TARGET= # target's name for the webhook
