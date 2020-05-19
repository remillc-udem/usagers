import { Router } from 'express'
import { count } from '../controllers/counter.controller'

export const counterRoute = Router();

counterRoute.use('/', count)