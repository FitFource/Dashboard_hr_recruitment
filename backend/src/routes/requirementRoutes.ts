import express from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import {
  getAllRequirements,
  createRequirement,
  deleteRequirement,
  updateRequirement,
  getPositionsList,
} from '../controllers/requirementController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();


router.get('/positions', getPositionsList);
router.get('/', authenticateToken, getAllRequirements);

router.post("/", authenticateToken, authorizeRoles("admin"), createRequirement);

router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteRequirement);

router.put("/:id", authenticateToken, authorizeRoles("admin"), updateRequirement);


export default router;

