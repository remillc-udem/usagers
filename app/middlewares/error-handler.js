export default function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (typeof err === 'string') {
    return res.status(500).json({
      status: "500",
      detail: err
    });
  }

  if (err.constructor.name === 'UserError') {

    if ('doc' in err) {
      return res.status(err.doc.status).json(err.doc);
    }

    if ('error' in err) {
      return res.status(err.error.status).json(err.error);
    }

    return res.status(500).json(err)
  }

  if (err instanceof Error) {
    return res.status(500).json({
      status: "500",
      detail: err.message
    });
  }

  let str;

  try {
    str = JSON.stringify(err);
  } catch (e) {
    str = 'Something bad appened'
  }

  res.status(500).json({
    status: "500",
    detail: str
  });
}