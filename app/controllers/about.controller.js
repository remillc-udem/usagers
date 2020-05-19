import pkg from '../../package'

export default {
  getIndex: function (req, res, next) {
    res.send(`API ${pkg.name} v${pkg.version} (${process.env.NODE_ENV})`);
    next();
  }
}