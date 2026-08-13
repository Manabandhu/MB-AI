import { readFileSync } from 'node:fs';

const canonical = readFileSync('packages/api-contracts/graphql/schema.graphqls', 'utf8');
const runtime = readFileSync('apps/backend/src/main/resources/graphql/schema.graphqls', 'utf8');

if (canonical !== runtime) {
  console.error(
    'GraphQL runtime schema differs from packages/api-contracts/graphql/schema.graphqls',
  );
  process.exit(1);
}
console.log('Verified canonical and runtime GraphQL schemas are identical.');
