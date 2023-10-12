import { Test, TestingModule } from '@nestjs/testing';
import { FinetuneOutputResolver } from './finetune-output.resolver';

describe('FinetuneOutputResolver', () => {
  let resolver: FinetuneOutputResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinetuneOutputResolver],
    }).compile();

    resolver = module.get<FinetuneOutputResolver>(FinetuneOutputResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
