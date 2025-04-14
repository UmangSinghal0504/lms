export const errorLogger = (err, req, res, next) => {
    console.error('ERROR:', {
      path: req.path,
      method: req.method,
      body: req.body,
      error: err.message,
      stack: err.stack
    });
    next(err);
  };