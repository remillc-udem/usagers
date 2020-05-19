
import { join } from 'path'
import { Counter } from '../lib/counter'

const counter = new Counter('code-barre', { dir: join(__dirname, '..', '..', 'data') });

export async function count(req, res, next) {
  const n = await counter.inc();
  res.send(n)
}