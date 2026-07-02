import { sendFail } from "../utils/error.js";
import { validateUserToken } from "../utils/token.js";

/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 */

export function authenticationMiddleware(req, res, next) {
    const authHeader = req.headers['authorization']

    // Accept token either from Authorization header or httpOnly cookie named 'token'
    let token;

    if (authHeader) {
        if (!authHeader.startsWith('Bearer '))
            return sendFail(
                res,
                400,
                "Authorization header must contain Bearer",
                "authorization"
            )

        token = authHeader.split(' ')[1];
    } else if (req.headers && req.headers.cookie) {
        const cookieHeader = req.headers.cookie; // raw cookie header
        const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('token='));
        if (match) {
            token = decodeURIComponent(match.split('=')[1]);
        }
    }

    if (!token) return next();

    const payload = validateUserToken(token);

    if (!payload) {
        return sendFail(
            res,
            401,
            "Invalid or expired token",
            "authorization"
        )
    }

    req.user = payload;
    next();
}

export function ensureAuthenticated(req, res, next) {
    if (!req.user || !req.user.id) {
        return sendFail(
            res,
            401,
            "You must be logged in to access this resource",
            "authentication"
        )
    }

    next();
}