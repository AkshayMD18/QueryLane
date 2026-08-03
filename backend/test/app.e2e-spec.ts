import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

jest.mock('@langchain/openrouter', () => {
  return {
    ChatOpenRouter: jest.fn().mockImplementation(() => {
      return {
        invoke: jest.fn().mockResolvedValue({ content: '{"recommendation": ["test task"]}' }),
      };
    }),
  };
});

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should run E2E flow', async () => {
    // 1. Create a group
    await request(app.getHttpServer())
      .post('/groups')
      .send({ name: 'E2E Test Group' })
      .expect(201);

    // 2. Fetch groups and get groupId
    const groupsResponse = await request(app.getHttpServer())
      .get('/groups')
      .expect(200);

    expect(groupsResponse.body.length).toBeGreaterThan(0);
    const groupId = groupsResponse.body[0].id;

    // 3. Upload a CSV table
    const tableName = `e2e_table_${Date.now()}`;
    const csvContent = 'name,value\nAlice,100\nBob,200';
    const uploadResponse = await request(app.getHttpServer())
      .post('/tables')
      .attach('file', Buffer.from(csvContent), 'data.csv')
      .query({ name: tableName, groupId });

    console.log('Upload Response Status:', uploadResponse.status, 'Body:', uploadResponse.body);
    expect(uploadResponse.status).toBe(201);

    expect(uploadResponse.body).toHaveProperty('rowCount');

    // 4. Get list of tables
    const tablesResponse = await request(app.getHttpServer())
      .get('/tables')
      .query({ groupId })
      .expect(200);

    expect(tablesResponse.body.data.length).toBeGreaterThan(0);
    const tableId = tablesResponse.body.data.find((t: any) => t.name === tableName).id;

    // 5. Store a query
    const executeQueryPayload = {
      query: {
        SQLiteQuery: `SELECT * FROM ${tableName}`,
        tableName: tableName,
        queryType: 'table',
      },
      tableId,
      userQuery: 'show all data',
    };

    const queryPostRes = await request(app.getHttpServer())
      .post('/query')
      .send(executeQueryPayload);
    console.log('Query Post Response Status:', queryPostRes.status, 'Body:', queryPostRes.body);
    expect(queryPostRes.status).toBe(201);

    // 6. Fetch queries
    const getQueriesResponse = await request(app.getHttpServer())
      .get('/query')
      .query({ tableId })
      .expect(200);

    expect(getQueriesResponse.body.length).toBeGreaterThan(0);
    const queryId = getQueriesResponse.body[0].id;

    // 7. Delete query
    await request(app.getHttpServer())
      .delete('/query')
      .query({ id: queryId })
      .expect(200);
  });
});
