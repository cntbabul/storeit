export const appwriteConfig = {
    endpointUrl: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim()!,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim()!,
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE?.trim()!,
    usersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION?.trim()!,
    filesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION?.trim()!,
    bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET?.trim()!,
    secretKey: process.env.NEXT_APPWRITE_KEY?.trim()!,
};