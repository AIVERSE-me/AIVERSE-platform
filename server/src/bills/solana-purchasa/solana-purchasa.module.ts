import { Module } from '@nestjs/common';
import { SolanaPurchasaService } from './solana-purchasa.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [ConfigModule, UserModule],
  providers: [SolanaPurchasaService],
  exports: [SolanaPurchasaService],
})
export class SolanaPurchasaModule {}
