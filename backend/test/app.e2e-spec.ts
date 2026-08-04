import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

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
  let createdGroupId: number;
  let createdTableName: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    if (createdTableName) {
      try {
        await dataSource.query(`DROP TABLE IF EXISTS ${createdTableName}`);
      } catch (e) {
        console.error('Failed to drop table', e);
      }
      try {
        await dataSource.query(`DELETE FROM tables WHERE tableName = ?`, [createdTableName]);
      } catch (e) {
        console.error('Failed to delete table record', e);
      }
    }
    if (createdGroupId) {
      try {
        await dataSource.query(`DELETE FROM groups WHERE id = ?`, [createdGroupId]);
      } catch (e) {
        console.error('Failed to delete group', e);
      }
    }
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
    // Find the newly created group ID
    const newGroup = groupsResponse.body.find((g: any) => g.name === 'E2E Test Group');
    const groupId = newGroup ? newGroup.id : groupsResponse.body[0].id;
    createdGroupId = groupId;

    // 3. Upload a CSV table
    const tableName = `e2e_table_${Date.now()}`;
    createdTableName = tableName;
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

    // 7.1 Execute and store group query
    const executeGroupQueryPayload = {
      query: {
        SQLiteQuery: `SELECT * FROM ${tableName}`,
        tableName: tableName,
        queryType: 'table',
      },
      groupId,
      userQuery: 'show all group data',
    };
    const groupQueryPostRes = await request(app.getHttpServer())
      .post('/query/group')
      .send(executeGroupQueryPayload);
    expect(groupQueryPostRes.status).toBe(201);

    // 7.2 Fetch group queries
    const getGroupQueriesResponse = await request(app.getHttpServer())
      .get('/query/group')
      .query({ groupId })
      .expect(200);
    expect(getGroupQueriesResponse.body.length).toBeGreaterThan(0);
    const groupQueryId = getGroupQueriesResponse.body[0].id;

    // 7.3 Delete group query
    await request(app.getHttpServer())
      .delete('/query/group')
      .query({ id: groupQueryId })
      .expect(200);

    // 8. Delete group cascadingly
    await request(app.getHttpServer())
      .delete(`/groups/${groupId}`)
      .expect(200);

    // Verify cleanup
    const dataSource = app.get(DataSource);
    const groups = await dataSource.query(`SELECT * FROM groups WHERE id = ?`, [groupId]);
    expect(groups.length).toBe(0);

    const tables = await dataSource.query(`SELECT * FROM tables WHERE groupId = ?`, [groupId]);
    expect(tables.length).toBe(0);

    let tableExists = true;
    try {
      await dataSource.query(`SELECT * FROM ${tableName} LIMIT 1`);
    } catch {
      tableExists = false;
    }
    expect(tableExists).toBe(false);
  });
});
