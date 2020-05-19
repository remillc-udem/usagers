import { join } from 'path'
import express from 'express'
import expressStatusMonitor from 'express-status-monitor'
import compression from 'compression'
import bodyParser from 'body-parser'
import chalk from 'chalk'

import cors from 'cors'

import { aboutRoute } from './routes/about.route'
import { userRoute } from './routes/user.route'
import { counterRoute } from './routes/counter.route'
import formulaireRoute from './routes/formulaire.route'
import errorHandler from './middlewares/error-handler'

import config from 'config'
import console from './lib/console'
import webLogger from '@remillc/web-logger'
import pkg from '../package.json'

const app = express();

/**
 * Express configuration
 */

app.set('port', config.get('app.port'))

app.use(expressStatusMonitor());
app.use(compression());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(webLogger({
  logDirectory: config.get('app.logDir')
}));

app.disable('x-powered-by');

app.use(function (req, res, next) {
  console.log(req.url)
  next();
})

// app.use('/formulaire', serveStatic(join(__dirname, 'public')))

// app.use('/formulaire', express.static(join(__dirname, '..', 'public')))
app.use('/formulaire', formulaireRoute)

app.options('*', cors(config.get('app.cors'))) // include before other routes

app.use(/^\/$/, aboutRoute)

app.use('/about', aboutRoute)

app.use('/users', userRoute)

app.use('/counter', counterRoute)

app.use(errorHandler)

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
});

module.exports = app;