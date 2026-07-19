import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase with the auto-provisioned configuration
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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
