import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, Firestore } from 'firebase/firestore';

interface FirebaseAppConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

let dbPromise: Promise<Firestore> | null = null;

async function getDb(): Promise<Firestore> {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    let firebaseConfig: FirebaseAppConfig = {};

    // 1. Try to load from Vite environment variables first (recommended to avoid secret scanner triggers)
    const env = (import.meta as any).env || {};

    if (env.VITE_FIREBASE_API_KEY) {
      firebaseConfig = {
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.VITE_FIREBASE_APP_ID,
        measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
        firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID,
      };
    } else {
      // 2. Fall back to the local config file if present
      try {
        const configs: Record<string, any> = (import.meta as any).glob('../../firebase-applet-config.json', { eager: true });
        const configKeys = Object.keys(configs);
        if (configKeys.length > 0) {
          const configModule: any = configs[configKeys[0]];
          firebaseConfig = configModule?.default || configModule || {};
        }
      } catch (e) {
        console.warn(
          "Firebase configuration file not found and environment variables not set. " +
          "Firestore features will be initialized with placeholders."
        );
      }
    }

    // Initialize Firebase with a safe fallback placeholder if no valid key exists
    const app = initializeApp(
      firebaseConfig.apiKey 
        ? firebaseConfig 
        : {
            apiKey: "AIzaSy_Placeholder_Key_For_Safe_Load",
            authDomain: "placeholder-domain.firebaseapp.com",
            projectId: "placeholder-project-id",
            storageBucket: "placeholder-project-id.firebasestorage.app",
            messagingSenderId: "1234567890",
            appId: "1:1234567890:web:abcdef123456"
          }
    );

    return firebaseConfig.firestoreDatabaseId 
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  })();

  return dbPromise;
}


export interface LeaderboardEntry {
  id?: string;
  username: string;
  score: number;
  timestamp?: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Fetch the top highscores from Firestore
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const path = 'leaderboard';
  try {
    const db = await getDb();
    const scoresCol = collection(db, path);
    // Fetch a larger pool to allow robust client-side de-duplication of pilot callsigns
    const q = query(scoresCol, orderBy('score', 'desc'), limit(1000));
    const snapshot = await getDocs(q);
    const results: LeaderboardEntry[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        username: data.username || 'Anonymous',
        score: Number(data.score) || 0,
        timestamp: data.timestamp
      });
    });

    return results;
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

// Submit a highscore to Firestore
export async function submitHighScore(username: string, score: number): Promise<boolean> {
  if (!username || username.trim() === '') return false;
  const path = 'leaderboard';
  try {
    const db = await getDb();
    const scoresCol = collection(db, path);
    await addDoc(scoresCol, {
      username: username.trim(),
      score: score,
      timestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error submitting highscore:", error);
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Submit a contact message to Firestore
export async function submitContactMessage(msg: ContactMessage): Promise<boolean> {
  const path = 'contact_messages';
  try {
    const db = await getDb();
    const contactsCol = collection(db, path);
    await addDoc(contactsCol, {
      name: msg.name.trim(),
      email: msg.email.trim(),
      subject: msg.subject.trim(),
      message: msg.message.trim(),
      timestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error submitting contact message:", error);
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}
