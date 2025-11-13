import logger from '#config/logger.js';
import {
  getAllUsers,
  getUserById,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/users.services.js';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';
import { jwttoken } from '#utils/jwt.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users');
    const allUsers = await getAllUsers();
    res.json({
      message: 'successfully retrieved users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

export const fetchUserById = async (req, res, next) => {
  try {
    const validation = userIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res
        .status(400)
        .json({
          error: 'validation failed',
          details: formatValidationError(validation.error),
        });
    }

    // Require authentication: check JWT cookie
    const token = req.cookies?.token;
    if (!token) {
      return res
        .status(401)
        .json({ error: 'unauthorized', message: 'please sign in' });
    }
    try {
      const payload = jwttoken.verify(token);
      // Optionally attach for downstream use
      req.user = { id: payload.id, email: payload.email, role: payload.role };
    } catch (e) {
      return res
        .status(401)
        .json({ error: 'unauthorized', message: 'invalid token' }, e);
    }

    const { id } = validation.data;
    logger.info(`Getting user by id: ${id}`);

    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    res.json({ message: 'successfully retrieved user', user });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    // Validate params and body
    const idResult = userIdSchema.safeParse(req.params);
    if (!idResult.success) {
      return res
        .status(400)
        .json({
          error: 'validation failed',
          details: formatValidationError(idResult.error),
        });
    }

    const bodyResult = updateUserSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res
        .status(400)
        .json({
          error: 'validation failed',
          details: formatValidationError(bodyResult.error),
        });
    }

    const { id } = idResult.data;
    const updates = bodyResult.data;

    // AuthZ checks: must be authenticated
    const authUser = req.user;
    if (!authUser) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const isAdmin = authUser.role === 'admin';
    const isSelf = Number(authUser.id) === Number(id);

    // Only admin or self can update
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // Only admin can change role
    if (!isAdmin && Object.prototype.hasOwnProperty.call(updates, 'role')) {
      return res
        .status(403)
        .json({ error: 'forbidden: only admin can change role' });
    }

    const updated = await updateUserService(id, updates);
    logger.info(`Updated user ${id}`);
    res.json({ message: 'user updated successfully', user: updated });
  } catch (error) {
    if (
      error?.code === 'USER_NOT_FOUND' ||
      error?.message === 'user not found'
    ) {
      return res.status(404).json({ error: 'user not found' });
    }
    logger.error(error);
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const validation = userIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res
        .status(400)
        .json({
          error: 'validation failed',
          details: formatValidationError(validation.error),
        });
    }
    const { id } = validation.data;

    // AuthZ: must be authenticated
    const authUser = req.user;
    if (!authUser) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const isAdmin = authUser.role === 'admin';
    const isSelf = Number(authUser.id) === Number(id);
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'forbidden' });
    }

    await deleteUserService(id);
    logger.info(`Deleted user ${id}`);
    res.json({ message: 'user deleted successfully' });
  } catch (error) {
    if (
      error?.code === 'USER_NOT_FOUND' ||
      error?.message === 'user not found'
    ) {
      return res.status(404).json({ error: 'user not found' });
    }
    logger.error(error);
    next(error);
  }
};
