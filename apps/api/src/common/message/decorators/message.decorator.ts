import { IRequestApp } from "@common/request/interfaces/request.interface";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const HeaderLang = createParamDecorator(
    (_: unknown, ctx: ExecutionContext): string => {
        const { headers } = ctx.switchToHttp().getRequest<IRequestApp>();
        const lang = headers['x-custom-lang'] || 'en';

        return Array.isArray(lang) ? lang[0] : lang;
    }
);