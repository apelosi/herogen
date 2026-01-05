import { neon } from '@netlify/neon';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

// Get database URL from environment variables
const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL or NETLIFY_DATABASE_URL environment variable is required');
}

export const db = drizzle({
    schema,
    client: neon(databaseUrl)
});