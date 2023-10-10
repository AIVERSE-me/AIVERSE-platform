import { Global, Module } from '@nestjs/common';
import { ImageUtilsService } from './image-utils.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [ImageUtilsService],
  exports: [ImageUtilsService],
})
export class CommonModule {}
