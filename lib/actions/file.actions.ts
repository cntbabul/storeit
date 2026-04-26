"use server";

import { AppwriteUser, DeleteFileProps, FileType, GetFilesProps, RenameFileProps, UpdateFileUsersProps, UploadFileProps } from "@/types";
import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user.actions";

const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
};

export const uploadFile = async ({
    file,
    ownerId,
    accountId,
    path,
}: UploadFileProps) => {
    const { storage, databases } = await createAdminClient();

    try {
        const inputFile = InputFile.fromBuffer(file, file.name);

        const bucketFile = await storage.createFile(
            appwriteConfig.bucketId,
            ID.unique(),
            inputFile,
        );

        const fileDocument = {
            type: getFileType(bucketFile.name).type,
            name: bucketFile.name,
            url: constructFileUrl(bucketFile.$id),
            extension: getFileType(bucketFile.name).extension,
            size: String(bucketFile.sizeOriginal),
            accountId,
            users: [],
            bucketFileId: bucketFile.$id,
        };

        const newFile = await databases
            .createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.filesCollectionId,
                ID.unique(),
                fileDocument,
            )
            .catch(async (error: unknown) => {
                await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
                handleError(error, "Failed to create file document");
            });

        revalidatePath(path);
        return parseStringify(newFile);
    } catch (error) {
        handleError(error, "Failed to upload file");
    }
};

const createQueries = (
    currentUser: AppwriteUser,
    types: string[],
    searchText: string,
    sort: string,
    limit?: number,
) => {
    const queries = [
        Query.or([
            Query.equal("accountId", currentUser.accountId),
            Query.contains("users", [currentUser.email]),
        ]),
    ];

    if (types.length > 0) queries.push(Query.equal("type", types));
    if (searchText) queries.push(Query.contains("name", searchText));
    if (limit) queries.push(Query.limit(limit));

    const [sortBy, orderBy] = sort.split("-");

    queries.push(
        orderBy === "asc" ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy),
    );

    return queries;
};

export const getFiles = async ({
    types = [],
    searchText = "",
    sort = "$createdAt-desc",
    limit,
}: GetFilesProps = {}) => {
    const { databases } = await createAdminClient();
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error("User not found");

        const queries = createQueries(currentUser, types, searchText, sort, limit);

        let files;
        try {
            files = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.filesCollectionId,
                queries,
            );
        } catch (error) {
            // Fallback: If querying shared files fails (e.g. virtual relationship error), 
            // only fetch the user's own files.
            console.error("Query failed, falling back to owner-only files:", error);
            const fallbackQueries = [Query.equal("accountId", currentUser.accountId)];
            files = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.filesCollectionId,
                fallbackQueries,
            );
        }

        // Collect unique owner accountIds across all files
        const ownerAccountIds = [...new Set(files.documents.map((f) => f.accountId as string))];

        // Single batch query to the users collection
        let owners: Models.DocumentList<Models.Document> = { documents: [], total: 0 };
        if (ownerAccountIds.length > 0) {
            owners = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.usersCollectionId,
                [Query.equal("accountId", ownerAccountIds)],
            );
        }

        // Build accountId → fullName lookup map
        const ownerMap: Record<string, string> = {};
        for (const user of (owners.documents as unknown as AppwriteUser[])) {
            ownerMap[user.accountId] = user.fullName;
        }

        // Attach ownerFullName to each file document and fix potential stale URLs
        const enrichedDocuments = files.documents.map((file) => ({
            ...file,
            ownerFullName: ownerMap[file.accountId as string] ?? "Unknown",
            url: constructFileUrl(file.bucketFileId),
        }));

        return parseStringify({ ...files, documents: enrichedDocuments });
    } catch (error) {
        handleError(error, "Failed to get files");
    }
};

export const renameFile = async ({ fileId, name, extension, path }: RenameFileProps) => {
    const { databases } = await createAdminClient();
    try {
        const newName = `${name}.${extension}`;
        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            { name: newName },
        );
        revalidatePath(path);
        return parseStringify(updatedFile)
    } catch (error) {
        handleError(error, "Failed to rename file");
    }
}

export const updateFileUsers = async ({ fileId, emails, path }: UpdateFileUsersProps) => {
    const { databases } = await createAdminClient();
    try {
        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            { users: emails },
        );
        revalidatePath(path);
        return parseStringify(updatedFile)
    } catch (error) {
        handleError(error, "Failed to update file users");
    }
}

export const deleteFile = async ({ fileId, bucketFileId, path }: DeleteFileProps) => {
    const { databases, storage } = await createAdminClient();
    try {
        const deletedFile = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId);
        if (deletedFile) {
            await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);
        }
        revalidatePath(path);
        return parseStringify({ status: "success" })
    } catch (error) {
        handleError(error, "Failed to update file users");
    }
}

// ============================== TOTAL FILE SPACE USED
export async function getTotalSpaceUsed() {
    try {
        const { databases } = await createSessionClient();
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error("User is not authenticated.");

        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            [Query.equal("accountId", [currentUser.accountId])],
        );

        const totalSpace = {
            image: { size: 0, latestDate: "" },
            document: { size: 0, latestDate: "" },
            video: { size: 0, latestDate: "" },
            audio: { size: 0, latestDate: "" },
            other: { size: 0, latestDate: "" },
            used: 0,
            all: 2 * 1024 * 1024 * 1024 /* 2GB available bucket storage */,
        };

        files.documents.forEach((file) => {
            const fileType = file.type as FileType;
            totalSpace[fileType].size += Number(file.size);
            totalSpace.used += Number(file.size);

            if (
                !totalSpace[fileType].latestDate ||
                new Date(file.$updatedAt) > new Date(totalSpace[fileType].latestDate)
            ) {
                totalSpace[fileType].latestDate = file.$updatedAt;
            }
        });

        return parseStringify(totalSpace);
    } catch (error) {
        handleError(error, "Error calculating total space used:, ");
    }
}
