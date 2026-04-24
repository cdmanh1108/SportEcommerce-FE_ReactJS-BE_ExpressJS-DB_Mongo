const errorHandler = (err, req, res, next) => {
  let { message, statusCode = 500, errorCode = -1 } = err;

  // Log error
  console.error(err);

  // If not operational error, set to internal server error
  if (!err.isOperational) {
    message = "Lỗi hệ thống!!!";
    statusCode = 500;
    errorCode = -1;
  }

  return res.status(statusCode).json({ code: errorCode, message });
};

export default errorHandler;
