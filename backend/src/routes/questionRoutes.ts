import express from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import {
  getAllQuestions,
  createQuestion,
  uploadQuestions,
  deleteQuestion,
} from '../controllers/questionController';
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
 * /api/questions:
 *   get:
 *     summary: Get all interview questions with filters
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, getAllQuestions);

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create a new interview question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'recruiter'),
  [
    body('job_role').notEmpty().withMessage('Job role is required'),
    body('question').notEmpty().withMessage('Question is required'),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
    validateRequest,
  ],
  createQuestion
);

/**
 * @swagger
 * /api/questions/upload:
 *   post:
 *     summary: Upload interview questions from CSV, Excel, or JSON file
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/upload',
  authenticateToken,
  authorizeRoles('admin'),
  upload.single('file'),
  uploadQuestions
);

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete an interview question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteQuestion);

export default router;
