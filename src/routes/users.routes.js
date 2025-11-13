import express from 'express';
import { fetchAllUsers, fetchUserById, updateUser, deleteUser } from "#controllers/users.controller.js";
import { authenticateToken, requireRole } from "#middleware/auth.middleware.js";

const router = express.Router();

// Get all users - requires admin role
router.get('/', authenticateToken, requireRole('admin'), fetchAllUsers);

// Get user by ID - requires authentication
router.get('/:id', authenticateToken, fetchUserById);

// Update user - requires authentication (authorization handled in controller)
router.put('/:id', authenticateToken, updateUser);

// Delete user - requires admin role
router.delete('/:id', authenticateToken, requireRole('admin'), deleteUser);

export default router;
