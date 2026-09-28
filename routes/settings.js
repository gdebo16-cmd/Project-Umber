import { Router } from 'express';
import { settings, settingsUpdate } from '../controllers/settingsController.js';

const router = Router();

router.get('/', settings);
router.post('/', settingsUpdate);
    
export default router;