import { doc, collection, addDoc, getDocs, query, orderBy, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Task } from '../types';

export interface Snapshot {
  id: string;
  timestamp: number;
  tasks: Task[];
  description: string;
}

export const createSnapshot = async (tasks: Task[], description: string): Promise<string> => {
  const snapshotRef = await addDoc(collection(db, 'snapshots'), {
    timestamp: Date.now(),
    tasks,
    description
  });
  return snapshotRef.id;
};

export const getSnapshots = async (): Promise<Snapshot[]> => {
  const q = query(collection(db, 'snapshots'), orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Snapshot));
};

export const getSnapshot = async (id: string): Promise<Snapshot | null> => {
  const docRef = doc(db, 'snapshots', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Snapshot;
  }
  return null;
};
