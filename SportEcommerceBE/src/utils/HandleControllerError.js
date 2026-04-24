const handleControllerError = (res, error) => {
  if (error?.isOperational) {
    return res.error(error.errorCode, error.message, error.statusCode);
  }

  console.error(error);
  return res.InternalError();
};

export default handleControllerError;
