import { DynamicModule, Global, Module } from '@nestjs/common';
import { HelperArrayService } from './services/helper.array.service';
import { HelperDateService } from './services/helper.date.service';
import { HelperEncryptionService } from './services/helper.encryption.service';
import { HelperHashService } from './services/helper.hash.service';
import { HelperNumberService } from './services/helper.number.service';
import { HelperStringService } from './services/helper.string.service';
import { HelperGeoService } from './services/helper.geo.service';

@Global()
@Module({})
export class HelperModule {
  static forRoot(): DynamicModule {
    return {
      module: HelperModule,
      providers: [
        HelperArrayService,
        HelperDateService,
        HelperEncryptionService,
        HelperHashService,
        HelperNumberService,
        HelperStringService,
        HelperGeoService,
      ],
      exports: [
        HelperArrayService,
        HelperDateService,
        HelperEncryptionService,
        HelperHashService,
        HelperNumberService,
        HelperStringService,
        HelperGeoService,
      ],
      controllers: [],
      imports: [],
    }
  }
}
