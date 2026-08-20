import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * C3 security fix: GET /creators/:username is unauthenticated and used to
 * return the account's private login email (see toPublicCreatorProfile's
 * comment). This boots a real Nest HTTP app so the assertion is against
 * the actual JSON the endpoint sends, not just the DTO mapping function in
 * isolation — a future change that re-adds `email` anywhere in the
 * pipeline (controller, service, or DTO) fails this test.
 */
describe('GET /creators/:username (public profile)', () => {
  let app: INestApplication;
  const findUnique = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CreatorsController],
      providers: [CreatorsService, { provide: PrismaService, useValue: { user: { findUnique } } }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: [''] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('never includes the private login email, password hash, or raw id in the response', async () => {
    findUnique.mockResolvedValue({
      id: 'user-internal-id-1',
      email: 'creator-private@example.com',
      username: 'somecreator',
      name: 'Some Creator',
      bio: 'A bio',
      avatarUrl: null,
      website: null,
      isCreator: true,
      passwordHash: '$2b$10$shouldneverleak',
      resetTokenHash: 'shouldneverleak',
      creatorProfile: null,
    });

    const res = await request(app.getHttpServer()).get('/v1/creators/somecreator').expect(200);

    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('resetTokenHash');
    expect(res.body).not.toHaveProperty('id');
    expect(JSON.stringify(res.body)).not.toContain('creator-private@example.com');

    expect(res.body).toEqual({
      username: 'somecreator',
      name: 'Some Creator',
      bio: 'A bio',
      avatarUrl: null,
      website: null,
      socialLinks: {},
    });
  });

  it('404s for a non-creator account without leaking whether the email/account exists', async () => {
    findUnique.mockResolvedValue({
      id: 'user-2',
      email: 'not-a-creator@example.com',
      username: 'notacreator',
      isCreator: false,
      creatorProfile: null,
    });

    const res = await request(app.getHttpServer()).get('/v1/creators/notacreator').expect(404);
    expect(JSON.stringify(res.body)).not.toContain('not-a-creator@example.com');
  });
});
