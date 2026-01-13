import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly chatId: string;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('telegram.botToken');
    this.chatId = this.configService.get<string>('telegram.chatId');
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
    // In local/dev, always log to console
    this.logger.log(`[Telegram OTP] To: ${phoneNumber}, Code: ${otp}`);

    if (!this.botToken || !this.chatId) {
      this.logger.warn('Telegram bot token or chat ID not configured. OTP not sent to Telegram.');
      return true;
    }

    try {
      const message = `🔐 *OTP Verification*\n\nPhone: ${phoneNumber}\nCode: \`${otp}\`\n\nValid for 5 minutes.`;
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

      await axios.post(url, {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'Markdown'
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send Telegram message', error);
      return false;
    }
  }
}
