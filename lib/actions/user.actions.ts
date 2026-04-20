/* eslint-disable @typescript-eslint/no-unused-vars */
"use server"

export const createAccount = async ({ fullName, email }: { fullName: string; email: string }) => {
    // Stub
    return { accountId: "123456" };
}

export const signInUser = async ({ email }: { email: string }) => {
    // Stub
    return { accountId: "123456" };
}