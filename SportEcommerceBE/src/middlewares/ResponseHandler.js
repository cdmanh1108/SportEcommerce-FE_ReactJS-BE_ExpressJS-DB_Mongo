const responseHandler = (req, res, next) => {
  res.success = (data, message = "Success") => {
    return res.status(200).json({ message, data });
  };

  res.error = (code, message, status = 400) => {
    return res.status(status).json({ code, message });
  };

  res.InternalError = (message = "Lỗi hệ thống!!!") => {
    return res.status(500).json({ code: -1, message });
  };

  next();
};

export default responseHandler;
