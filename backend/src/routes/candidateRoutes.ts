import express from 'express';
import { body } from 'express-validator';
import {
  getAllCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '../controllers/candidateController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Get all candidates with filters
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, getAllCandidates);

/**
 * @swagger
 * /api/candidates/{id}:
 *   get:
 *     summary: Get candidate by ID with history and documents
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticateToken, getCandidateById);

/**
 * @swagger
 * /api/candidates:
 *   post:
 *     summary: Create a new candidate
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'recruiter'),
  [
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('job_role').notEmpty().withMessage('Job role is required'),
    body('status').optional().isIn(['in_progress', 'accepted', 'rejected']),
    body('score').optional().isInt({ min: 0, max: 100 }),
    validateRequest,
  ],
  createCandidate
);

/**
 * @swagger
 * /api/candidates/{id}:
 *   put:
 *     summary: Update candidate
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticateToken, authorizeRoles('admin', 'recruiter'), updateCandidate);

/**
 * @swagger
 * /api/candidates/{id}:
 *   delete:
 *     summary: Delete candidate
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteCandidate);

export default router;
