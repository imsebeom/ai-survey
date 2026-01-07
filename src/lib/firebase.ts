import { initializeApp, getApps } from 'firebase/app';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import type { Survey, SurveyResponse } from '@/types';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

// Collections
const SURVEYS_COLLECTION = 'surveys';
const RESPONSES_COLLECTION = 'responses';

// Utility function to remove undefined values from an object
function removeUndefined<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
}

// Survey CRUD
export async function createSurvey(survey: Omit<Survey, 'id'>): Promise<string> {
    const cleanedSurvey = removeUndefined(survey);
    const docRef = await addDoc(collection(db, SURVEYS_COLLECTION), {
        ...cleanedSurvey,
        createdAt: Timestamp.fromDate(survey.createdAt),
    });
    return docRef.id;
}

export async function getSurvey(id: string): Promise<Survey | null> {
    const docRef = doc(db, SURVEYS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
    } as Survey;
}

export async function updateSurvey(id: string, updates: Partial<Survey>): Promise<void> {
    const docRef = doc(db, SURVEYS_COLLECTION, id);
    await updateDoc(docRef, updates);
}

export async function deleteSurvey(id: string): Promise<void> {
    const docRef = doc(db, SURVEYS_COLLECTION, id);
    await deleteDoc(docRef);
}

export async function getAllSurveys(): Promise<Survey[]> {
    const q = query(collection(db, SURVEYS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
        } as Survey;
    });
}

// Response CRUD
export async function createResponse(response: Omit<SurveyResponse, 'id'>): Promise<string> {
    const cleanedResponse = removeUndefined(response);
    const docRef = await addDoc(collection(db, RESPONSES_COLLECTION), {
        ...cleanedResponse,
        submittedAt: Timestamp.fromDate(response.submittedAt),
    });
    return docRef.id;
}

export async function getResponsesBySurvey(surveyId: string): Promise<SurveyResponse[]> {
    const q = query(
        collection(db, RESPONSES_COLLECTION),
        orderBy('submittedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs
        .map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                submittedAt: data.submittedAt?.toDate() || new Date(),
            } as SurveyResponse;
        })
        .filter((response) => response.surveyId === surveyId);
}
