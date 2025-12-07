import {
  applyDecorators,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

export function ThrottleredGuard() {
  return applyDecorators(UseGuards(ThrottlerGuard));
}
