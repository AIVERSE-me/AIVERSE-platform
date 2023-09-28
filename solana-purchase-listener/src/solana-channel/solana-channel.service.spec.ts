import { Test, TestingModule } from '@nestjs/testing';
import { SolanaChannelService } from './solana-channel.service';

describe('SolanaChannelService', () => {
  let service: SolanaChannelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SolanaChannelService],
    }).compile();

    service = module.get<SolanaChannelService>(SolanaChannelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
