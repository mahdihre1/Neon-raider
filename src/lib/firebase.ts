import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, setDoc, getDocs, query, orderBy, limit, serverTimestamp, Firestore } from 'firebase/firestore';

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

// Seed scores for local fallback so the leaderboard is vibrant from day one
const SEED_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'seed_1', username: 'Apex Valkyrie', score: 48200, timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { id: 'seed_2', username: 'Commander Vance', score: 34500, timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
  { id: 'seed_3', username: 'Major Vex', score: 28100, timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
  { id: 'seed_4', username: 'Nova-7', score: 19800, timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString() },
  { id: 'seed_5', username: 'Pulse Rider', score: 14200, timestamp: new Date(Date.now() - 96 * 3600 * 1000).toISOString() },
  { id: 'seed_6', username: 'Ghost Operator', score: 9600, timestamp: new Date(Date.now() - 120 * 3600 * 1000).toISOString() },
  { id: 'seed_7', username: 'Hyperion Star', score: 6300, timestamp: new Date(Date.now() - 144 * 3600 * 1000).toISOString() },
];

function getLocalLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem('neon_raider_local_scores_v2');
    let localList: LeaderboardEntry[] = raw ? JSON.parse(raw) : [...SEED_LEADERBOARD];

    // Merge in user's current local highscore if present
    const rawStats = localStorage.getItem('neon_raider_stats_v1');
    const rawUsername = localStorage.getItem('neon_raider_username_v1') || 'Rookie Raider';
    if (rawStats) {
      const stats = JSON.parse(rawStats);
      if (stats.highScore && stats.highScore > 0) {
        const u = rawUsername.trim();
        const existingIdx = localList.findIndex(item => item.username.toLowerCase() === u.toLowerCase());
        if (existingIdx !== -1) {
          if (stats.highScore > localList[existingIdx].score) {
            localList[existingIdx].score = stats.highScore;
            localList[existingIdx].timestamp = new Date().toISOString();
          }
        } else {
          localList.push({
            id: 'user_local',
            username: u,
            score: stats.highScore,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    localList.sort((a, b) => b.score - a.score);
    localStorage.setItem('neon_raider_local_scores_v2', JSON.stringify(localList));
    return localList;
  } catch (e) {
    return [...SEED_LEADERBOARD];
  }
}

function saveLocalHighScore(username: string, score: number) {
  try {
    const localList = getLocalLeaderboard();
    const u = username.trim();
    const existingIdx = localList.findIndex(item => item.username.toLowerCase() === u.toLowerCase());
    if (existingIdx !== -1) {
      if (score > localList[existingIdx].score) {
        localList[existingIdx].score = score;
        localList[existingIdx].timestamp = new Date().toISOString();
      }
    } else {
      localList.push({
        id: `local_${Date.now()}`,
        username: u,
        score: score,
        timestamp: new Date().toISOString()
      });
    }
    localList.sort((a, b) => b.score - a.score);
    localStorage.setItem('neon_raider_local_scores_v2', JSON.stringify(localList));
  } catch (e) {
    console.warn("Could not write local highscore cache:", e);
  }
}

// Fetch the top highscores from Firestore (with local cache fallback)
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const localScores = getLocalLeaderboard();
  const path = 'leaderboard';
  try {
    const db = await getDb();
    const scoresCol = collection(db, path);
    // Fetch a larger pool to allow robust client-side de-duplication of pilot callsigns
    const q = query(scoresCol, orderBy('score', 'desc'), limit(1000));
    const snapshot = await getDocs(q);
    const remoteResults: LeaderboardEntry[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      remoteResults.push({
        id: doc.id,
        username: data.username || 'Anonymous',
        score: Number(data.score) || 0,
        timestamp: data.timestamp
      });
    });

    // Combine local and remote entries, de-duplicating by username
    const map = new Map<string, LeaderboardEntry>();
    for (const item of [...remoteResults, ...localScores]) {
      const key = item.username.toLowerCase().trim();
      if (!map.has(key) || (map.get(key)!.score < item.score)) {
        map.set(key, item);
      }
    }

    const merged = Array.from(map.values()).sort((a, b) => b.score - a.score);
    return merged;
  } catch (error) {
    console.warn("Firestore fetch offline or unprovisioned, using local sector standings cache:", error);
    return localScores;
  }
}

// Submit a highscore to Firestore (upsert keyed by normalized username)
export async function submitHighScore(username: string, score: number): Promise<boolean> {
  const trimmed = username.trim();
  if (!trimmed) return false;
  
  // Save locally first so score is recorded immediately
  saveLocalHighScore(trimmed, score);

  // Normalize username for document ID (alphanumeric, underscore, hyphen up to 20 chars)
  const docId = trimmed.toLowerCase().replace(/[^a-z0-9_\-]/g, '_').substring(0, 20) || 'anonymous';
  const path = `leaderboard/${docId}`;
  
  try {
    const db = await getDb();
    const docRef = doc(db, 'leaderboard', docId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const existingScore = Number(snap.data()?.score) || 0;
      if (score > existingScore) {
        await setDoc(docRef, {
          username: trimmed.substring(0, 20),
          score: score,
          timestamp: serverTimestamp()
        }, { merge: true });
      }
    } else {
      await setDoc(docRef, {
        username: trimmed.substring(0, 20),
        score: score,
        timestamp: serverTimestamp()
      });
    }
    return true;
  } catch (error) {
    console.warn("Could not sync highscore to cloud Firestore, local cache preserved:", error);
    return true;
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
