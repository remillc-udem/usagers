import fs, { promises as fsp } from 'fs'
import { join } from 'path'
import { rejects } from 'assert';
import console from './console'

export class Counter {
  constructor(name, { dir = __dirname } = {}) {
    this.name = name;
    this.filePath = join(dir, name);
    this._count = 0;

    try {

      if (!fs.existsSync(this.filePath)) {
        fs.appendFileSync(this.filePath, '0')
      } else {

        const actualCount = fs.readFileSync(this.filePath, {
          encoding: 'utf-8'
        })

        if (actualCount && actualCount !== '') {
          this._count = +actualCount;
        } else {
          throw new Error('Count not read the counter file ' + this.filePath)
        }
      }
    } catch (e) {
      console.error('could not read file ' + this.filePath)
      console.error(e)
    }

  }

  async inc() {
    return new Promise(async (resolve, reject) => {
      try {
        this._count++;
        await fsp.writeFile(this.filePath, this._count);
        resolve(`${this._count}`);
      } catch (e) {
        rejects(e)
      }
    })
  }
}