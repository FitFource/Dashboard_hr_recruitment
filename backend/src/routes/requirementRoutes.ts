import express from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import {
  getAllRequirements,
  createRequirement,
  uploadRequirements,
  deleteRequirement,
} from '../controllers/requirementController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.json'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, Excel, and JSON files are allowed.'));
    }
  },
});

/**
 * @swagger
 * /api/requirements:
 *   get:
 *     summary: Get all job requirements with filters
 *     tags: [Requirements]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, getAllRequirements);

/**
 * @swagger
 * /api/requirements:
 *   post:
 *     summary: Create a new job requirement
 *     tags: [Requirements]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'recruiter'),
  [
    body('job_role').notEmpty().withMessage('Job role is required'),
    body('requirement_type').notEmpty().withMessage('Requirement type is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('is_mandatory').optional().isBoolean(),
    validateRequest,
  ],
  createRequirement
);

/**
 * @swagger
 * /api/requirements/upload:
 *   post:
 *     summary: Upload job requirements from CSV, Excel, or JSON file
 *     tags: [Requirements]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/upload',
  authenticateToken,
  authorizeRoles('admin'),
  upload.single('file'),
  uploadRequirements
);

/**
 * @swagger
 * /api/requirements/{id}:
 *   delete:
 *     summary: Delete a job requirement
 *     tags: [Requirements]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteRequirement);

export default router;
