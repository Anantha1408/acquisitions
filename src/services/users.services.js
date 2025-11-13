import logger from '#config/logger.js';
import { users } from '#models/user.model.js';
import { db } from '#config/database.js';
import { eq } from 'drizzle-orm';

export const getAllUsers = async () => {
  try {
    return await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users);
  } catch (err) {
    logger.error('Error getting users list', err);
    throw err;
  }
};

export const getUserById = async id => {
  try {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return rows[0] || null;
  } catch (err) {
    logger.error('Error getting user by id', err);
    throw err;
  }
};

export const updateUser = async (id, updates) => {
  try {
    // Ensure user exists first
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (existing.length === 0) {
      const error = new Error('user not found');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const toUpdate = { ...updates, updated_at: new Date() };

    const [updated] = await db
      .update(users)
      .set(toUpdate)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    return updated;
  } catch (err) {
    logger.error('Error updating user', err);
    throw err;
  }
};

export const deleteUser = async id => {
  try {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!deleted) {
      const error = new Error('user not found');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return deleted;
  } catch (err) {
    logger.error('Error deleting user', err);
    throw err;
  }
};
