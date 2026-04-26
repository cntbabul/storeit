import { Client, Account } from "appwrite";
import { appwriteConfig } from "./config";

const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

export const account = new Account(client);
export default client;
