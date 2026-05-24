import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  const prismaMock = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should report live status without touching the database', () => {
      expect(appController.live()).toMatchObject({ ok: true });
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    });

    it('should report database readiness when the query succeeds', async () => {
      await expect(appController.ready()).resolves.toMatchObject({
        ok: true,
        db: { ok: true },
      });
    });

    it('should keep /health available when the database query fails', async () => {
      prismaMock.$queryRaw.mockRejectedValueOnce(new Error('db down'));

      await expect(appController.health()).resolves.toMatchObject({
        ok: true,
        db: { ok: false },
      });
    });
  });
});
