"use server"

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { parseStringify } from "@/lib/utils";
import { cookies } from "next/headers";
import { avatarPlaceholderUrl } from "@/constants/index";
import { redirect } from "next/navigation";

const getUserByEmail = async (email: string) => {
    const { databases } = await createAdminClient();

    const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("email", [email])]
    )
    return result.total > 0 ? result.documents[0] : null
}
const handleError = (error: unknown, message: string) => {
    console.error("Failed to create user", error);
    throw new Error(message);
}

export const sendEmailOTP = async ({ email }: { email: string }) => {
    const { account } = await createAdminClient();

    try {
        const session = await account.createEmailToken(ID.unique(), email)
        return session.userId;
    } catch (error) {
        handleError(error, "Failed to send OTP")
    }
}

export const createAccount = async ({ fullName, email }: { fullName: string, email: string }) => {
    const existingUser = await getUserByEmail(email);
    const accountId = await sendEmailOTP({ email });

    if (!accountId) throw new Error("Failed to send OTP");

    if (!existingUser) {
        const { databases, account } = await createAdminClient();

        await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            ID.unique(),
            {
                fullName,
                email,
                avatar: avatarPlaceholderUrl,
                accountId
            }
        );
    }
    return parseStringify({ accountId })
}

export const verifySecret = async ({ accountId, password }: { accountId: string, password: string }) => {
    try {
        const { account } = await createAdminClient();
        const session = await account.createSession(accountId, password);
        (await cookies()).set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true
        })

        return parseStringify({ sessionId: session.$id })
    } catch (error) {
        handleError(error, "Failed to verify OTP");
    }
}

export const getCurrentUser = async () => {
    try {
        const { databases, account } = await createSessionClient();

        const result = await account.get();

        const user = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            [Query.equal("accountId", result.$id)]
        );

        if (user.total <= 0) {
            // Create user document if it doesn't exist (e.g. after Google Login)
            const newUser = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.usersCollectionId,
                ID.unique(),
                {
                    fullName: result.name || result.email.split("@")[0],
                    email: result.email,
                    avatar: avatarPlaceholderUrl,
                    accountId: result.$id,
                }
            );
            return parseStringify(newUser);
        }

        return parseStringify(user.documents[0]);
    } catch (error) {
        console.log("getCurrentUser error:", error);
        return null;
    }
}

export const syncSession = async (sessionSecret: string) => {
    try {
        const { cookies } = await import("next/headers");
        (await cookies()).set("appwrite-session", sessionSecret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });
        return true;
    } catch (error) {
        console.log("Error syncing session:", error);
        return false;
    }
}

export const signOutUser = async () => {
    const { account } = await createSessionClient();

    try {
        await account.deleteSession("current");
        (await cookies()).delete("appwrite-session");
    } catch (error) {
        handleError(error, "Failed to sign out user");
    } finally {
        redirect("/sign-in");
    }
};

export const signInUser = async ({ email }: { email: string }) => {
    try {
        const existingUser = await getUserByEmail(email);

        // User exists, send OTP
        if (existingUser) {
            await sendEmailOTP({ email });
            return parseStringify({ accountId: existingUser.accountId });
        }

        return parseStringify({ accountId: null, error: "User not found" });
    } catch (error) {
        handleError(error, "Failed to sign in user");
    }
};