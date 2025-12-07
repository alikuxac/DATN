import { Module } from '@nestjs/common';
import { RouterModule as NestJSRouterModule } from '@nestjs/core';

import { RouterAdminModule } from './router/router.admin.module';
import { RouterSharedModule } from './router/router.shared.module';
import { RouterUserModule } from './router/router.user.module';
import { RoutesPublicModule } from './router/router.public.module';
@Module({
  imports: [
    RouterUserModule,
    RouterAdminModule,
    RouterSharedModule,
    RoutesPublicModule,
    NestJSRouterModule.register([
      { path: '/admin', module: RouterAdminModule },
      { path: '/shared', module: RouterSharedModule },
      { path: '/user', module: RouterUserModule },
      { path: '/public', module: RoutesPublicModule },
    ])
  ]
})
export class RoutersModule {}