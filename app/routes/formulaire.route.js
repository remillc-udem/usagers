import { join } from 'path'
import express from 'express'
import { Router } from 'express'

const formulaireRoute = Router();

formulaireRoute.use(express.static(join(__dirname, '..', '..', 'public')))

export default formulaireRoute;

