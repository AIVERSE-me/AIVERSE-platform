import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillsModule } from './bills/bills.module';
import { BullModule } from '@nestjs/bull';
import { CommonModule } from './common/common.module';
import { SolanaModule } from './solana/solana.module';
import { LoggerModule } from './logger/logger.module';
import { AiProductModule } from './ai-product/ai-product.module';
import { HandleSolanaTransferModule } from './handle-solana-transfer/handle-solana-transfer.module';
import { SolanaPublishModule } from './solana-publish/solana-publish.module';
import { FinetuneOutputModule } from './finetune-output/finetune-output.module';
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
    }),
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'mysql',
          host: configService.get('DB_HOST'),
          port: configService.get<number>('DB_PORT', { infer: true }),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          autoLoadEntities: true,
          synchronize: configService.get<boolean>('DB_SYNC', { infer: true }),
          timezone: configService.get('DB_TIMEZONE') || 'Z',
          // logging: true,
        };
      },
    }),
    EventEmitterModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: 'static',
      serveRoot: '/assets',
      serveStaticOptions: {
        maxAge: 3600 * 24 * 30 * 1000,
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          redis: {
            host: config.get('BULL_REDIS_HOST'),
            port: +config.get('BULL_REDIS_PORT'),
          },
          prefix: config.get('BULL_QUEUE_PREFIX'),
        };
      },
    }),
    BillsModule,
    CommonModule,
    LoggerModule,
    FinetuneOutputModule,
    AiProductModule,
    SolanaModule,
    SolanaPublishModule,
    HandleSolanaTransferModule,
  ],
})
export class AppModule {}
