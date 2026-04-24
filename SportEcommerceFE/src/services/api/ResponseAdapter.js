export const normalizeSuccessPayload = (payload) => {
  if (payload && typeof payload === "object") {
    const hasLegacyKeys =
      Object.prototype.hasOwnProperty.call(payload, "EC") ||
      Object.prototype.hasOwnProperty.call(payload, "EM") ||
      Object.prototype.hasOwnProperty.call(payload, "result");
    if (hasLegacyKeys) {
      return {
        ...payload,
        EC: payload.EC ?? 0,
        EM: payload.EM ?? payload.message ?? "Success",
        result:
          payload.result !== undefined
            ? payload.result
            : payload.data !== undefined
              ? payload.data
              : null,
      };
    }

    const hasNewKeys =
      Object.prototype.hasOwnProperty.call(payload, "message") ||
      Object.prototype.hasOwnProperty.call(payload, "data");
    if (hasNewKeys) {
      return {
        ...payload,
        EC: 0,
        EM: payload.message ?? "Success",
        result: payload.data !== undefined ? payload.data : null,
      };
    }
  }

  return {
    EC: 0,
    EM: "Success",
    result: payload ?? null,
  };
};

export const normalizeErrorPayload = (payload, statusCode) => {
  if (payload && typeof payload === "object") {
    const hasLegacyKeys =
      Object.prototype.hasOwnProperty.call(payload, "EC") ||
      Object.prototype.hasOwnProperty.call(payload, "EM");
    if (hasLegacyKeys) {
      return {
        ...payload,
        EC: payload.EC ?? payload.code ?? statusCode ?? -1,
        EM: payload.EM ?? payload.message ?? "Lỗi hệ thống!!!",
        result: payload.result ?? null,
      };
    }

    return {
      ...payload,
      EC: payload.code ?? statusCode ?? -1,
      EM: payload.message ?? "Lỗi hệ thống!!!",
      result: null,
    };
  }

  return {
    EC: statusCode ?? -1,
    EM: "Lỗi kết nối đến server",
    result: null,
  };
};
