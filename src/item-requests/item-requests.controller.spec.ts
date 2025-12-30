import { Test, TestingModule } from '@nestjs/testing';
import { ItemRequestsController } from './item-requests.controller';
import { ItemRequestsService } from './item-requests.service';

describe('ItemRequestsController', () => {
  let controller: ItemRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemRequestsController],
      providers: [ItemRequestsService],
    }).compile();

    controller = module.get<ItemRequestsController>(ItemRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
