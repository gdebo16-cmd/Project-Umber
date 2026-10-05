import { Router } from 'express';
import { showCharacter, showInventory, addArmor, addWeapon, removeArmor, removeWeapon, adjustHp, deleteCharacter, showEditCharacter, editClass, editLevel, editAbilities, editNameAndRace } from '../controllers/charController.js';

const router = Router();

router.get('/:id/inventory', showInventory);
router.post('/:id/delete', deleteCharacter);
router.post('/:id/hp', adjustHp);
router.post('/:id/inventory/armor', addArmor);
router.post('/:id/inventory/weapon', addWeapon);
router.post('/:id/inventory/armor/remove', removeArmor);
router.post('/:id/inventory/weapon/remove', removeWeapon);
router.get('/:id/edit', showEditCharacter);
router.post('/:id/edit/class', editClass);
router.post('/:id/edit/level', editLevel);
router.post('/:id/edit/abilities', editAbilities);
router.post('/:id/edit/name', editNameAndRace);
router.get('/:id', showCharacter);

export default router;
