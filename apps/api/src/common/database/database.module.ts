import { DynamicModule, Global, Module, OnModuleInit } from '@nestjs/common';
import { DatabaseOptionService } from '@common/database/services/database.options.service';
import { DatabaseService } from '@common/database/services/database.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from './constants/database.constant';
@Module({
    providers: [DatabaseOptionService],
    exports: [DatabaseOptionService],
    imports: [],
    controllers: [],
})
export class DatabaseOptionModule {}

@Global()
@Module({})
export class DatabaseModule implements OnModuleInit {
    onModuleInit() {
        console.log('DatabaseModule');
    }
    static forRoot(): DynamicModule {
        return {
            module: DatabaseModule,
            providers: [DatabaseService],
            exports: [DatabaseService],
            // imports: [ MongooseModule.forRootAsync({
            //       inject: [DatabaseOptionService],
            //       imports: [DatabaseOptionModule],
            //       connectionName: DATABASE_CONNECTION_NAME,
            //       useFactory: (databaseService: DatabaseOptionService) => 
            //         databaseService.createOptions(),
            //     }),    
            // ],
            controllers: [],
        };
    }
}
