import {Router} from 'express'
import apiController from '../controller/apiController';
import rateLimiter from '../middleware/rateLimiter';

const router = Router();

router.route('/self').get(rateLimiter ,apiController.self)
router.route('/health').get(apiController.health)

export default router;