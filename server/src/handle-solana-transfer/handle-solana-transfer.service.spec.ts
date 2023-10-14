import { Test, TestingModule } from '@nestjs/testing';
import { HandleSolanaTransferService } from './handle-solana-transfer.service';

describe('HandleSolanaTransferService', () => {
  let service: HandleSolanaTransferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HandleSolanaTransferService],
    }).compile();

    service = module.get<HandleSolanaTransferService>(HandleSolanaTransferService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
