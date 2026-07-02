export function sendValidationError(res, issues) {
    return res.status(400).json({
        status: "fail",
        message: "Validation failed",
        errors: issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
        })),
    });
}

export function sendFail(res, statusCode, message, field, errors) {
    return res.status(statusCode).json({
        status: "fail",
        message,
        errors: errors ?? (field ? [{ field, message }] : []),
    });
}