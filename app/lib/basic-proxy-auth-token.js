export default function basicProxyAuthToken(username, password) {
  // Basic proxy authorization
  const base64 = Buffer.from(username + ':' + password, 'utf8').toString('base64');
  return 'Basic ' + base64;
}