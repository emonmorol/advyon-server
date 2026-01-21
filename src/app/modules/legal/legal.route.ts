import express from 'express';
import { LegalController } from './legal.controller';

const router = express.Router();

router.get('/', LegalController.getAllLegals);
router.get('/:id', LegalController.getSingleLegal);

export const LegalRoutes = router;
