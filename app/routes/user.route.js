import { Router } from 'express'
import { create } from '../controllers/user.controller'

export const userRoute = Router();

userRoute.post('/', create)

