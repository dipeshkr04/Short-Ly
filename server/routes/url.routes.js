import express from "express"
import { sendFail, sendValidationError } from "../utils/error.js";
import { shortenPostRequestBodySchema } from "../validation/request.validation.js";
import { db } from "../src/index.js";
import { urlsTable } from "../models/url.model.js";
import { nanoid } from "nanoid";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { insertNewURL } from "../services/user.service.js";
import { eq, and } from "drizzle-orm";

const router = express.Router();

router.post('/shorten', ensureAuthenticated, async function (req, res) {
    const validationResult = await shortenPostRequestBodySchema.safeParseAsync(req.body)

    if (!validationResult.success) {
        return sendValidationError(res, validationResult.error.issues);
    }

    const { url, code } = validationResult.data;

    const shortCode = code ?? nanoid(8);

    const result = await insertNewURL(req.user.id, url, shortCode);

    return res.status(201).json({ status: 'success', data: { id: result.id, shortCode: result.shortCode, targetURL: result.targetURL } });
})

router.post('/codes', ensureAuthenticated, async (req, res) => {
    const codes = await db
        .select()
        .from(urlsTable)
        .where(eq(urlsTable.userId, req.user.id))
    return res.json({ status: 'success', data: { codes } })
})

router.delete('/:id', ensureAuthenticated, async (req, res) => {

    try {
        const deletedRows = await db
            .delete(urlsTable)
            .where(and(
                eq(urlsTable.id, req.params.id),
                eq(urlsTable.userId, req.user.id)
            ))
            .returning({ id: urlsTable.id });

        if (!deletedRows || deletedRows.length === 0) {
            return sendFail(
                res,
                404,
                "Deletion Failed. Record not Found",
                "deletion"
            )
        }

        return res.status(200).json({ status: 'success', data: { deleted: true } });
    } catch (err) {
        console.error("Database deletion error:", err);

        return sendFail(
            res,
            500,
            "An internal server error occurred while trying to delete the record.",
            "server"
        )
    }
})

router.get('/:shortCode', async (req, res) => {
    const code = req.params.shortCode

    const [result] = await db
        .select({
            targetURL: urlsTable.targetURL
        })
        .from(urlsTable)
        .where(eq(urlsTable.shortCode, code))

    if (!result) {
        return sendFail(res, 404, 'Invalid URL', 'shortCode')
    }
    return res.redirect(result.targetURL);
})

export default router;