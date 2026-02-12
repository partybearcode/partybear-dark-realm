import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyANFcfVn57Qknv0xRBRIAuOPF2GpD2b4eo',
  authDomain: 'users-partybear-dark-realm.firebaseapp.com',
  projectId: 'users-partybear-dark-realm',
  storageBucket: 'users-partybear-dark-realm.firebasestorage.app',
  messagingSenderId: '713985244014',
  appId: '1:713985244014:web:4daf145ed97413fd085f7f',
  measurementId: 'G-JL8V8LB7DY',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
