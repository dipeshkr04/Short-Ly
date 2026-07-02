import { createHmac, randomBytes } from 'node:crypto';

export function hashedPasswordwithSalt(password, userSalt = undefined) {
    const salt = userSalt ?? randomBytes(256).toString('hex')
    const hashedPassword = createHmac('sha256', salt)
        .update(password)
        .digest('hex')

    return { salt, hashedPassword }
}