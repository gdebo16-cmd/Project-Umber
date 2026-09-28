import { Router } from 'express';
import { charCreate, charCreateStep1, charCreateStep2, charCreateStep2Submit, selectSubclass, charCreateStep3, rollStat, charCreateStep3Submit } from '../controllers/charController.js';

const router = Router();

    
router.get("/", charCreate); 
router.post("/step1", charCreateStep1);
router.get("/step2", charCreateStep2);
router.post("/step2", charCreateStep2Submit);
router.get('/subclasses/:classId', selectSubclass);
router.get("/step3", charCreateStep3);
router.post("/step3", charCreateStep3Submit);
router.post("/roll/:stat", rollStat);

export default router;