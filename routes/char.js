import { Router } from 'express';
import { showCharacter } from '../controllers/charController.js';

const router = Router();

router.get('/:id', showCharacter);
export default router;