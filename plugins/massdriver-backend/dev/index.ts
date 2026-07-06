import { createBackend } from '@backstage/backend-defaults';
import { mockServices } from '@backstage/backend-test-utils';

// Development setup for the Massdriver backend relay.
//
// Start it with `yarn start` in this package directory, then (with a
// `massdriver` config block providing organizationId + apiToken) POST a query:
//
//   curl http://localhost:7007/api/massdriver/graphql \
//     -H 'Content-Type: application/json' \
//     -H 'Authorization: Bearer mock-service-token' \
//     -d '{"query": "query($organizationId: ID!) { projects(organizationId: $organizationId) { items { id name } } }"}'

const backend = createBackend();

// Mock the auth services so the relay can be called without a real identity.
backend.add(mockServices.auth.factory());
backend.add(mockServices.httpAuth.factory());

backend.add(import('../src'));

backend.start();
