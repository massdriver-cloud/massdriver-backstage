import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import request from 'supertest';
import { massdriverPlugin } from './plugin';

describe('massdriverPlugin', () => {
  const startBackend = async () =>
    startTestBackend({
      features: [
        massdriverPlugin,
        mockServices.rootConfig.factory({
          data: {
            massdriver: {
              organizationId: 'org-1',
              apiToken: 'tok',
              baseUrl: 'https://api.example.com',
            },
          },
        }),
      ],
    });

  it('registers and mounts the relay route', async () => {
    const { server } = await startBackend();
    // The route is mounted at /api/massdriver — a request reaches the handler
    // rather than 404ing.
    const response = await request(server)
      .post('/api/massdriver/graphql')
      .send({ query: '{ me { id } }' });
    expect(response.status).not.toBe(404);
  });

  it('maps a missing query to a 400 InputError through the backend', async () => {
    const { server } = await startBackend();
    const response = await request(server)
      .post('/api/massdriver/graphql')
      .send({});
    expect(response.status).toBe(400);
  });
});
