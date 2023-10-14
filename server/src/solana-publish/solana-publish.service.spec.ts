import { Test, TestingModule } from '@nestjs/testing';
import { SolanaPublishService } from './solana-publish.service';

describe('SolanaPublishService', () => {
  let service: SolanaPublishService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SolanaPublishService],
    }).compile();

    service = module.get<SolanaPublishService>(SolanaPublishService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
