import { execSync } from 'child_process';

export default async function globalSetup() {
  process.env['DATABASE_URL'] =
    process.env['TEST_DATABASE_URL'] ??
    'postgresql://postgres:postgres@localhost:5432/timetracker_test';

  execSync('npx prisma migrate deploy', {
    env: { ...process.env },
    stdio: 'inherit',
  });
}
