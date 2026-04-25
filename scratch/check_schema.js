
import { createAdminClient } from "../lib/appwrite/index";
import { appwriteConfig } from "../lib/appwrite/config";

async function checkSchema() {
    const { databases } = await createAdminClient();
    try {
        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            []
        );
        console.log("File attributes:", Object.keys(files.documents[0] || {}));
        console.log("Sample file users:", files.documents[0]?.users);
    } catch (error) {
        console.error("Error checking schema:", error);
    }
}

checkSchema();
