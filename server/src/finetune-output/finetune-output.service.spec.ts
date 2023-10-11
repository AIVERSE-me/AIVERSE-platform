import { Test, TestingModule } from '@nestjs/testing';
import { FinetuneOutputService } from './finetune-output.service';

describe('FinetuneOutputService', () => {
  let service: FinetuneOutputService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinetuneOutputService],
    }).compile();

    service = module.get<FinetuneOutputService>(FinetuneOutputService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
