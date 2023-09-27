import { Test, TestingModule } from '@nestjs/testing';
import { SolanaNftTransferService } from './solana-nft-transfer.service';

describe('SolanaNftTransferService', () => {
  let service: SolanaNftTransferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SolanaNftTransferService],
    }).compile();

    service = module.get<SolanaNftTransferService>(SolanaNftTransferService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
