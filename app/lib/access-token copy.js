import axios from 'axios'
import { camelCase } from 'camel-case'
import config from 'config'
import console from './console'

const authConfig = config.get('auth')

function wait(n) {
  return new Promise(resolve => {
    setTimeout(resolve, n)
  })
}

export class AccessToken {
  constructor({
    grantType = 'client_credentials',
    scope,
    wskey = config.get('identityManagementAPIWsKey.key'),
    wskeySecret = config.get('identityManagementAPIWsKey.secret'),
    tokenHost = 'https://oauth.oclc.org',
    tokenPath = '/token',
    expiresAt = null,
    authenticatingInstitutionId = null,
    contextInstitutionId = null,
    httpClientTimeout = config.get('httpClient.timeout')

  } = {}) {
    this.grantType = grantType;
    this.tokenConfig = {
      scope
    };
    this.tokenHost = tokenHost;
    this.tokenPath = tokenPath;
    this.scope = scope;
    this.wskey = wskey;
    this.wskeySecret = wskeySecret;

    // Token data
    this.expiresAt = expiresAt;
    this.authenticatingInstitutionId = authenticatingInstitutionId;
    this.contextInstitutionId = contextInstitutionId;
    this.tokenType = null;
    this.httpClientTimeout = httpClientTimeout;
  }

  async requestAccessToken({ grantType = this.grantType } = {}) {

    if (process.env.http_proxy) {

      return new Promise((resolve, reject) => {
        axios.post(this.tokenHost + this.tokenPath, {}, {
          params: {
            grant_type: grantType,
            scope: normalizeScope(this.tokenConfig.scope)
          },
          auth: {
            username: this.wskey,
            password: this.wskeySecret
          },
          timeout: this.httpClientTimeout,
          proxy: {
            host: 'mandataire.ti.umontreal.ca',
            port: 80
          }
        })
          .then(response => {
            console.debug('response')
            if (response.status === 200) {
              // Success
              Object.keys(response.data).forEach(key => this[camelCase(key)] = response.data[key])
              return resolve(this);
            }

            const data = {}

            Object.keys(response.data).forEach(key => data[camelCase(key)] = response.data[key])
            reject(data);
          })
          .catch((e) => {
            // console.error(e)
            console.error(Object.keys(e))
            console.error(e.response)
            process.exit()
            const reason = new Error('data' in e ? e.data : 'errno' in e ? e.errno : e)
            reject(reason)
          })
      })
    } else {

      return new Promise((resolve, reject) => {
        axios.post(this.tokenHost + this.tokenPath, {}, {
          params: {
            grant_type: grantType,
            scope: normalizeScope(this.tokenConfig.scope)
          },
          auth: {
            username: this.wskey,
            password: this.wskeySecret
          },
          timeout: this.httpClientTimeout,
        })
          .then(response => {
            console.debug('response')
            if (response.status === 200) {
              // Success
              Object.keys(response.data).forEach(key => this[camelCase(key)] = response.data[key])
              return resolve(this);
            }

            const data = {}

            Object.keys(response.data).forEach(key => data[camelCase(key)] = response.data[key])
            reject(data);
          })
          .catch((e) => {
            // console.error(e)
            console.error(Object.keys(e))
            console.error(e.response)
            process.exit()
            const reason = new Error('data' in e ? e.data : 'errno' in e ? e.errno : e)
            reject(reason)
          })
      })
    }
  }


  async _doCreate() {
    console.debug('- request')
    return this.requestAccessToken();
  }

  async create({ trial = 1, maxTrials = authConfig.tokenTrials, interval = authConfig.tokenTrialsInterval } = {}) {

    return new Promise(async (resolve, reject) => {
      console.log('trial #' + trial)
      let token = null;

      try {
        token = await this._doCreate(maxTrials)
        console.debug('token created at trial #' + trial)
        resolve(token);
      } catch (e) {
        console.warn('token creation trial #' + trial + ' failed with error ')
        console.warn(e)

        trial++;

        if (trial <= maxTrials) {
          await wait(interval);
          return await this.create({ trial, maxTrials, interval });
        } else {
          const err = new Error(`Could not create access token after ${maxTrials} trials. ${e.message}`)
          console.error(err)
          reject(err);
        }
      }

    })
  }

  // async refresh() {
  //   return this.requestAccessToken({ grantType: 'refresh_token' });
  // }

  /**
    * Determines if the current access token has already expired or if it is about to expire
    *
    * @param {Number} expirationWindowSeconds Window of time before the actual expiration to refresh the token
    * @returns {Boolean}
    */

  isExpired(expirationWindowSeconds = 0) {
    if (this.expiresAt) {
      expirationWindowSeconds = expirationWindowSeconds * 1000;
      console.log(new Date(this.expiresAt) - Date.now())
      return new Date(this.expiresAt) - Date.now() <= expirationWindowSeconds;
    }
    return true;
  }
}

function normalizeScope(scope) {
  // Build a space separated scope list from an array of scopes.
  let normalizedScope = "";
  if (scope && Array.isArray(scope)) {
    for (let i = 0; i < scope.length; i++) {
      normalizedScope += scope[i];
      if (i !== scope.length - 1) {
        normalizedScope += " ";
      }
    }
  }
  return normalizedScope;
}

//
// ====================================================
//

if (process.mainModule.filename === __filename) {
  (async () => {
    const maxTrials = 10,
      interval = 5000,
      result = {
        success: 0,
        fail: 0
      }

    await doTrial(0);

    async function doTrial(trial) {
      trial++;
      if (trial > maxTrials) {
        console.log('End test')
        console.log(result)
      }
      else {
        console.log(`Round ${trial}`)

        // const t = new AccessToken({ scope: ['configPlatform context:263683', 'WorldCatMetadataAPI', 'refresh_token'] })
        const t = new AccessToken({
          scope: ['SCIM']
        })
        try {
          const data = await t.create();
          result.success++;
          console.log('success')
          // console.log(data)
        } catch (e) {
          result.fail++;
          console.log('error')
          console.error('data' in e ? e.data : 'errno' in e ? e.errno : e)
        }

        setTimeout(() => {
          doTrial(trial)
        }, interval)

      }
    }
  })()
}