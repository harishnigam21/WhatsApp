import { cert, initializeApp } from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json";

export const app = initializeApp({
  credential: cert({
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
  }),
});
