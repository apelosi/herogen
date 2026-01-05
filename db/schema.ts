import { pgTable, text, varchar, boolean, bigint, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    photoUrl: text('photo_url'), // Base64 encoded hero face
    createdAt: timestamp('created_at').defaultNow()
});

export const comics = pgTable('comics', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    title: text('title').notNull(),
    themeId: text('theme_id').notNull(),
    alignment: varchar('alignment', { length: 10 }).notNull(), // 'HERO' or 'VILLAIN'
    panels: jsonb('panels').notNull(), // Array of {id, caption, imageUrl}
    isPublic: boolean('is_public').default(false).notNull(),
    rating: bigint('rating', { mode: 'number' }).default(0).notNull(),
    createdAt: bigint('created_at', { mode: 'number' }).notNull() // Unix timestamp
});