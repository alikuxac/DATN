import { registerAs } from '@nestjs/config';

export default registerAs(
  'telegram',
  (): Record<string, any> => ({
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  })
);
