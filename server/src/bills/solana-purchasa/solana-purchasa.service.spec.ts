import { Test, TestingModule } from '@nestjs/testing';
import { SolanaPurchasaService } from './solana-purchasa.service';

describe('SolanaPurchasaService', () => {
  let service: SolanaPurchasaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SolanaPurchasaService],
    }).compile();

    service = module.get<SolanaPurchasaService>(SolanaPurchasaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
