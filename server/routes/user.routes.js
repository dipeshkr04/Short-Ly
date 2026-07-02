import express from 'express'
import { loginRoutePostBodySchema, signupRoutePostBodySchema } from '../validation/request.validation.js';
import { hashedPasswordwithSalt } from '../utils/hash.js';
import { getExistingUser, insertNewUser } from '../services/user.service.js';
import { createUserToken } from '../utils/token.js';
import { sendValidationError, sendFail } from '../utils/error.js';

const router = express.Router()

router.post('/signup', async (req, res) => {
    const validationResult = signupRoutePostBodySchema.safeParse(req.body ?? {});

    if (!validationResult.success) {
        return sendValidationError(res, validationResult.error.issues);
    }

    const { firstName, lastName, email, password } = validationResult.data;

    const existingUser = await getExistingUser(email);

    if (existingUser) {
        return sendFail(
            res,
            400,
            "User already exists",
            "email"
        );
    }

    const { salt, hashedPassword } = hashedPasswordwithSalt(password);

    const user = await insertNewUser({ email, firstName, lastName, salt, password: hashedPassword })

    return res.status(201).json({ status: 'success', data: { userId: user.id } })
})

router.post('/login', async (req, res) => {
    const validationResult = loginRoutePostBodySchema.safeParse(req.body ?? {});

    if (!validationResult.success) {
        return sendValidationError(res, validationResult.error.issues);
    }

    const { email, password } = validationResult.data;

    const user = await getExistingUser(email)

    if (!user) {
        return sendFail(
            res,
            404,
            "User not found",
            "email"
        );
    }

    const { hashedPassword } = hashedPasswordwithSalt(password, user.salt);

    if (user.password !== hashedPassword) {
        return sendFail(
            res,
            400,
            "Invalid Password",
            "password"
        )
    }

    try {
        const token = await createUserToken({ id: user.id }, "15m")
        // set httpOnly cookie (token is not returned in JSON for security)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000
        })

        return res.status(200).json({ status: 'success', data: {} })
    } catch (err) {
        if (err && err.status === 'fail') {
            return sendFail(res, 401, err.message, 'token', err.errors)
        }
        throw err
    }
})

export default router;