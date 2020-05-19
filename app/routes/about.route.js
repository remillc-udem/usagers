import { Router } from 'express'
import aboutController from '../controllers/about.controller'

export const aboutRoute = Router();

aboutRoute.use(aboutController.getIndex)

