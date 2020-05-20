import { join } from 'path'
import { promises as fsp } from 'fs'
import { body } from 'express-validator'
import { pick } from 'lodash'
import { validate } from '../lib/validate'
import { AccessToken } from '../lib/access-token'
import { Counter } from '../lib/counter'
import { sendConfirmMail } from '../lib/mailer'
import User from '../models/User'
import config from 'config'
import console from '../lib/console'

const accessToken = new AccessToken({
  scope: ['SCIM']
})

const httpClientConfig = config.get('httpClient')

async function _sendData(data, token, institution) {
  return new Promise(async (resolve, reject) => {
    console.debug('Sending data to WMS SCIM (user) API')
    try {
      console.log(httpClientConfig)
      const options = {};
      if ('proxy' in httpClientConfig && httpClientConfig.proxy) {
        options.proxy = httpClientConfig.proxy;
      }
      if ('timeout' in httpClientConfig && httpClientConfig.timeout) {
        options.httpClientTimeout = httpClientConfig.timeout;
      }
      const user = await User.add(data, institution, token.accessToken, options);
      // console.warn(user)
      console.debug('Success')
      resolve(user)

    } catch (e) {
      console.debug('Error sending data')
      console.error(e)
      // if (e.constructor.name === 'UserError') {
      //   return reject(e.doc);
      // }

      reject(e)
    }
  })
}

const counter = new Counter('code-barre', { dir: join(__dirname, '..', '..', 'data') })

async function doCreate(req, res, next) {
  // console.debug(req.body)
  let user,
    data,
    token,
    institution = config.get('identityManagementAPIWsKey.institution');

  try {
    token = await accessToken.create();
    console.debug('Token created.')

    const props = [
      'givenName',
      'familyName',
      'email',
      'streetAddress',
      'locality',
      'region',
      'country',
      'postalCode',
      'externalId',
      'borrowerCategory',
      'homeBranch',
    ];

    data = pick(req.body, props);
    const num = await counter.inc();

    // Additional fields added server side
    let now = new Date(),
      year = now.getFullYear(),
      month = now.getMonth(),
      oclcExpirationDate;

    // Are we in October or more?
    if (month >= 9) {
      oclcExpirationDate = `${year + 1}-10-01T00:00:00Z`;
    } else {
      oclcExpirationDate = `${year}-10-01T00:00:00Z`;
    }

    data.oclcExpirationDate = oclcExpirationDate;
    data.isVerified = false;
    data.barcode = `um${`${num}`.padStart(6, '0')}`;

  } catch (e) {
    console.error(e);
    return next(e)
  }

  try {
    console.debug('Sending create user request to wms')
    user = await _sendData(data, token, institution);
    // Save user data 
    const userData = {
      id: user.doc.id,
      created: (new Date).toISOString(),
      doc: data
    }

    userData.doc.consentement = req.body.consentement;

    await fsp.writeFile(join(__dirname, '..', '..', 'data', `${data.barcode}.json`), JSON.stringify(userData, null, 2));
    console.debug('User created in WMS.')
  } catch (err) {
    try {
      console.error(JSON.stringify(err))
    } catch (e) {
      console.error(err)
    }
    return next(err)
  }

  try {
    await sendConfirmMail(data.email)
    console.debug('Email sent')
  } catch (err) {
    console.error(err)
    next(err);
  }

  res.json(user)
}

export const create = [
  validate([
    body('givenName', 'Missing parameter').exists(),
    body('familyName', 'Missing parameter').exists(),
    body('email', 'Missing parameter').exists(),
    body('email').isEmail(),
    body('borrowerCategory', 'Missing parameter').exists(),
    body('homeBranch', 'Missing parameter').exists(),
    body('streetAddress', 'Missing parameter').exists(),
    body('locality', 'Missing parameter').exists(),
    body('region', 'Missing parameter').exists(),
    body('country', 'Missing parameter').exists(),
    body('postalCode', 'Missing parameter').exists(),
    body('telephone', 'Missing parameter').exists(),
    body('consentement', 'Missing parameter').equals('oui'),
  ]),
  doCreate
]

















//
// ====================================================
//

if (process.mainModule.filename === __filename) {
  (async () => {
    const token = await createToken(accessToken)
    console.log('ici: ' + token)
  })()
}