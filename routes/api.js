// JSON routes for the React client. Everything here is mounted at /api in index.js.
import { Router } from 'express';
import {
    getCharacter, updateHp, updateSheetState, deleteCharacter,
    equipArmor, unequipArmor, equipWeapon, unequipWeapon,
} from '../controllers/apiController.js';
import { me, login, logout, register, home, getSettings, updateSettings, getProfile, updateProfile, deleteAccount } from '../controllers/apiUserController.js';
import { getInventory, addArmor, addWeapon, removeArmor, removeWeapon } from '../controllers/apiInventoryController.js';
import { getEditCharacter, editNameAndRace, editClass, editLevel, editAbilities, editFeatureChoice, editPortrait } from '../controllers/apiEditController.js';
import { getRaces, getSubraces, step1Submit, getStep2, step2Submit, getStep3, step3Submit, clearDraft, getDraft, rollStat, selectSubclass, getStartingGear } from '../controllers/apiCreateController.js';
import { getSpellbook, learnSpell, unlearnSpell, prepareSpell, unprepareSpell, setAction, removeAction } from '../controllers/apiSpellController.js';
import { createCampaign, deleteCampaign, getCampaign, updateCampaign, listCampaigns, joinCampaign, setCampaignCharacter } from '../controllers/apiCampaignController.js';

import { rateLimit } from 'express-rate-limit';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: { error: 'Too many attempts. Please try again in 15 minutes.'}
});

const router = Router();

// login / account
router.post('/login', loginLimiter, login);
router.post('/register', loginLimiter, register);
router.get('/me', me);
router.post('/logout', logout);
router.get('/home', home);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.delete('/settings', deleteAccount);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// character creation
router.get('/create_char/races', getRaces);
router.get('/races/:id/subraces', getSubraces);
router.post('/create_char/step1', step1Submit);
router.get('/create_char/step2', getStep2);
router.post('/create_char/step2', step2Submit);
router.get('/create_char/subclasses/:classId', selectSubclass);
router.get('/create_char/gear', getStartingGear);
router.get('/create_char/step3', getStep3);
router.post('/create_char/step3', step3Submit);
router.get('/create_char/draft', getDraft);
router.delete('/create_char/draft', clearDraft);
router.post('/create_char/roll/:stat', rollStat);

// character sheet
router.get('/characters/:id', getCharacter);
router.delete('/characters/:id', deleteCharacter);
router.patch('/characters/:id/hp', updateHp);
router.patch('/characters/:id/state', updateSheetState);
router.post('/characters/:id/inventory/armor/equip', equipArmor);
router.post('/characters/:id/inventory/armor/unequip', unequipArmor);
router.post('/characters/:id/inventory/weapon/equip', equipWeapon);
router.post('/characters/:id/inventory/weapon/unequip', unequipWeapon);

// inventory page (add / remove items)
router.get('/characters/:id/inventory', getInventory);
router.post('/characters/:id/inventory/armor', addArmor);
router.post('/characters/:id/inventory/weapon', addWeapon);
router.post('/characters/:id/inventory/armor/remove', removeArmor);
router.post('/characters/:id/inventory/weapon/remove', removeWeapon);

// spell book (learn / unlearn spells)
router.get('/characters/:id/spellbook', getSpellbook);
router.post('/characters/:id/spells/learn', learnSpell);
router.post('/characters/:id/spells/unlearn', unlearnSpell);
router.post('/characters/:id/spells/prepare', prepareSpell);
router.post('/characters/:id/spells/unprepare', unprepareSpell);
router.post('/characters/:id/spells/setAction', setAction);
router.post('/characters/:id/spells/removeAction', removeAction);

// character editor
router.get('/characters/:id/edit', getEditCharacter);
router.post('/characters/:id/edit/name', editNameAndRace);
router.post('/characters/:id/edit/portrait', editPortrait);
router.post('/characters/:id/edit/class', editClass);
router.post('/characters/:id/edit/level', editLevel);
router.post('/characters/:id/edit/abilities', editAbilities);
router.post('/characters/:id/edit/features', editFeatureChoice);

// campaign creation and deletion
router.get('/campaigns', listCampaigns);
router.post('/campaigns', createCampaign);
router.post('/campaigns/join', joinCampaign);
router.get('/campaigns/:id', getCampaign);
router.patch('/campaigns/:id', updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);
router.put('/campaigns/:id/character', setCampaignCharacter);


// If any route above crashes, answer with JSON instead of an HTML error page.
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server' });
});

export default router;
