import express from 'express';
import {
  getAllRequirements,
  createRequirement,
  deleteRequirement,
  updateRequirement,
  getPositionsList,
  getAllRequirementsUser,
  getPositionsListUser ,
} from '../controllers/requirementController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = express.Router();


router.get('/positions', getPositionsList);
router.get('/', authenticateToken, getAllRequirements);

router.post("/", authenticateToken, authorizeRoles("admin", "user"), createRequirement);

router.delete('/:id', authenticateToken, authorizeRoles("admin", "user"), deleteRequirement);

router.put("/:id", authenticateToken, authorizeRoles("admin", "user"), updateRequirement);


// USER ROUTES

router.get('/user/getAll', authenticateToken, getAllRequirementsUser);
router.get('/user/positions', authenticateToken, getPositionsListUser);

export default router;


