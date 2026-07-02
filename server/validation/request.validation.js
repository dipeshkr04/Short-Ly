import { z } from "zod";

export const signupRoutePostBodySchema = z.object({
    firstName: z.string({
        error: "First name is required"
    }).min(2, { message: "First Name must be of atleast 2 characters long" }), // Prevents empty strings like ""

    lastName: z.string().optional(),

    email: z.string({
        error: "Email is required"
    })
        .email({ message: "Invalid email address format" }), // Custom message for format validation

    password: z.string({
        error: "Password is required"
    })
        .min(8, { message: "Password must be at least 8 characters long" })
        .max(12, { message: "Password must be at most 12 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" })
});

export const loginRoutePostBodySchema = z.object({
    email: z.string({
        error: "Email is required"
    })
        .email({ message: "Invalid email address format" }), // Custom message for format validation

    password: z.string({
        error: "Password is required"
    })
        .min(8, { message: "Password must be at least 8 characters long" })
        .max(12, { message: "Password must be at most 12 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" })
})

export const shortenPostRequestBodySchema = z.object({
    url: z.string({ message: "Missing url"}).url(),
    code: z.string().optional()
})