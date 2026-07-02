import jwt from 'jsonwebtoken'
import { userTokenSchema } from '../validation/token.validation.js';

const JWT_SECRET = process.env.JWT_SECRET;

export async function createUserToken(payload, expirationTime = undefined){
    const validationResult = await userTokenSchema.safeParseAsync(payload)

    if(!validationResult.success){
        const errors = validationResult.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
        }))

        throw {
            status: 'fail',
            message: 'Validation failed',
            errors
        }
    }

    const options = expirationTime ? { expiresIn: expirationTime } : undefined
    const token = jwt.sign(validationResult.data, JWT_SECRET, options)

    return token;
}

export function validateUserToken(token){
    try{
        const payload = jwt.verify(token, JWT_SECRET);
        return payload;
    }catch(err){
        return null;
    }
}