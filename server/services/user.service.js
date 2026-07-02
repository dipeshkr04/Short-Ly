import { db } from "../src/index.js";
import { usersTable } from "../models/user.model.js";
import { urlsTable } from "../models/url.model.js";
import { eq } from "drizzle-orm";

export async function getExistingUser(email) {
    const [existingUser] = await db
        .select({
            id: usersTable.id,
            firstName: usersTable.firstName,
            lastName: usersTable.lastName,
            email: usersTable.email,
            password: usersTable.password,
            salt: usersTable.salt
        })
        .from(usersTable)
        .where(eq(email, usersTable.email))

    return existingUser;
}

export async function insertNewUser({ email, firstName, lastName, salt, password }) {
    const [user] = await db.insert(usersTable).values({
        email,
        firstName,
        lastName,
        password,
        salt,
    }).returning({ id: usersTable.id });

    return user;
}

export async function insertNewURL(userId, url, shortCode) {
    const [result] = await db.insert(urlsTable).values({
        shortCode,
        targetURL: url,
        userId
    }).returning({
        id: urlsTable.id,
        shortCode: urlsTable.shortCode,
        targetURL: urlsTable.targetURL
    });

    return result;
}