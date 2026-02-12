import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import {
  arrayUnion,
  doc,
  deleteDoc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { auth, db, storage } from '../services/firebase'
import { deleteUser, EmailAuthProvider } from 'firebase/auth'
import { hasAllAchievements } from '../utils/achievementUtils'
import { getAvatarDataUrl } from '../utils/avatarUtils'

const AuthContext = createContext(null)

const getUserPhotoUrl = (user, displayName) => {
  const providerPhoto =
    user.providerData?.find((provider) => provider.photoURL)?.photoURL || ''
  return (
    user.photoURL ||
    providerPhoto ||
    getAvatarDataUrl(displayName || user.displayName, user.email)
  )
}

const getDefaultDisplayName = (user, preferredName) =>
  preferredName ||
  user.displayName ||
  user.email?.split('@')[0] ||
  'Night Reader'

const defaultProfile = (user, preferredName) => ({
  uid: user.uid,
  email: user.email,
  displayName: getDefaultDisplayName(user, preferredName),
  photoURL: getUserPhotoUrl(user, preferredName),
  xp: 0,
  achievements: [],
  completedComics: [],
  platinumAwarded: false,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
})

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [achievementQueue, setAchievementQueue] = useState([])

  const syncProfile = async (user, preferredName) => {
    const profileRef = doc(db, 'users', user.uid)
    const displayName = getDefaultDisplayName(user, preferredName)
    const incomingPhoto = getUserPhotoUrl(user, displayName)
    try {
      const snapshot = await getDoc(profileRef)
      if (snapshot.exists()) {
        const existing = snapshot.data()
        const shouldUpdateName =
          preferredName && preferredName !== existing.displayName
        const isDefaultPhoto =
          !existing.photoURL ||
          String(existing.photoURL).startsWith('data:image/svg+xml')
        const shouldUpdatePhoto =
          incomingPhoto && incomingPhoto !== existing.photoURL && isDefaultPhoto

        if (shouldUpdatePhoto || shouldUpdateName) {
          await updateDoc(profileRef, {
            photoURL: incomingPhoto,
            displayName: shouldUpdateName
              ? preferredName
              : user.displayName || existing.displayName,
            updatedAt: serverTimestamp(),
          })
          const updated = {
            ...existing,
            photoURL: incomingPhoto,
            displayName: shouldUpdateName
              ? preferredName
              : user.displayName || existing.displayName,
          }
          setProfile(updated)
          return updated
        }
        setProfile({
          platinumAwarded: false,
          ...existing,
        })
        return existing
      }

      const freshProfile = defaultProfile(user, preferredName)
      await setDoc(profileRef, freshProfile)
      setProfile(freshProfile)
      return freshProfile
    } catch (error) {
      // Offline or Firestore not available. Keep a local profile so UI works.
      const localProfile = {
        ...defaultProfile(user, preferredName),
        photoURL: getUserPhotoUrl(user, displayName),
        xp: profile?.xp || 0,
        achievements: profile?.achievements || [],
        completedComics: profile?.completedComics || [],
      }
      setProfile(localProfile)
      return localProfile
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        try {
          await syncProfile(user)
        } catch (error) {
          console.warn('Profile sync failed:', error)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const register = async ({ email, password, displayName }) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    if (displayName) {
      await updateProfile(credential.user, { displayName })
    }
    await syncProfile(credential.user, displayName)
    return credential.user
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const credential = await signInWithPopup(auth, provider)
    await syncProfile(credential.user)
    return credential.user
  }

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const logout = () => signOut(auth)

  const updateUserProfile = async ({ displayName, photoURL }) => {
    if (!currentUser) return
    await updateProfile(currentUser, {
      displayName: displayName || currentUser.displayName,
      photoURL: photoURL || currentUser.photoURL,
    })

    const profileRef = doc(db, 'users', currentUser.uid)
    const nextDisplayName =
      displayName ||
      currentUser.displayName ||
      profile?.displayName ||
      currentUser.email?.split('@')[0] ||
      'Night Reader'
    const shouldUpdateAvatar =
      !photoURL &&
      String(profile?.photoURL || '').startsWith('data:image/svg+xml')
    const nextPhotoUrl = photoURL
      ? photoURL
      : shouldUpdateAvatar
        ? getAvatarDataUrl(nextDisplayName, currentUser.email)
        : currentUser.photoURL
    await updateDoc(profileRef, {
      displayName: nextDisplayName,
      photoURL: nextPhotoUrl,
      updatedAt: serverTimestamp(),
    })
    setProfile((prev) => ({
      ...prev,
      displayName: nextDisplayName,
      photoURL: nextPhotoUrl || prev?.photoURL,
    }))
  }

  const uploadAvatar = async (file) => {
    if (!currentUser || !file) return ''
    const avatarRef = ref(storage, `avatars/${currentUser.uid}/${file.name}`)
    await uploadBytes(avatarRef, file)
    return getDownloadURL(avatarRef)
  }

  const addXp = async (amount) => {
    if (!currentUser || !amount) return
    const profileRef = doc(db, 'users', currentUser.uid)
    try {
      await updateDoc(profileRef, {
        xp: increment(amount),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.warn('XP sync skipped:', error)
    }
    setProfile((prev) => ({
      ...prev,
      xp: (prev?.xp || 0) + amount,
    }))
  }

  const pushAchievement = (title) => {
    const id = `${Date.now()}-${Math.random()}`
    setAchievementQueue((prev) => [...prev, { id, title }])
  }

  const dismissAchievement = (id) => {
    setAchievementQueue((prev) => prev.filter((item) => item.id !== id))
  }

  const awardPlatinum = async (achievementsList) => {
    if (!currentUser || !achievementsList) return
    if (profile?.platinumAwarded) return
    if (!hasAllAchievements(achievementsList)) return
    const profileRef = doc(db, 'users', currentUser.uid)
    const displayName =
      profile?.displayName || currentUser.displayName || 'Night Reader'
    pushAchievement(`Platinum Trophy: ${displayName}`)
    setProfile((prev) => ({ ...prev, platinumAwarded: true }))
    try {
      await updateDoc(profileRef, {
        platinumAwarded: true,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.warn('Platinum sync skipped:', error)
    }
  }

  const unlockAchievement = async (title) => {
    if (!currentUser || !title) return
    const existing = new Set(profile?.achievements || [])
    if (existing.has(title)) return
    const updated = [...existing, title]
    setProfile((prev) => ({ ...prev, achievements: updated }))
    pushAchievement(title)
    const profileRef = doc(db, 'users', currentUser.uid)
    try {
      await updateDoc(profileRef, {
        achievements: arrayUnion(title),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.warn('Achievement sync skipped:', error)
    }
    await awardPlatinum(updated)
  }

  const markComicComplete = async (slug) => {
    if (!currentUser || !slug) return
    const profileRef = doc(db, 'users', currentUser.uid)
    let data = null
    try {
      const snapshot = await getDoc(profileRef)
      data = snapshot.data()
    } catch (error) {
      console.warn('Comic sync skipped:', error)
    }
    const completedComics = new Set(
      data?.completedComics || profile?.completedComics || []
    )
    if (completedComics.has(slug)) {
      return false
    }
    completedComics.add(slug)

    const achievements = new Set(data?.achievements || profile?.achievements || [])
    const newAchievements = []
    if (completedComics.size >= 5) achievements.add('Read 5 comics')
    if (completedComics.size >= 10) achievements.add('Read 10 comics')
    if (completedComics.size >= 16) achievements.add('Read all comics')
    achievements.forEach((achievement) => {
      if (!(data?.achievements || profile?.achievements || []).includes(achievement)) {
        newAchievements.push(achievement)
      }
    })

    try {
      await updateDoc(profileRef, {
        completedComics: Array.from(completedComics),
        achievements: Array.from(achievements),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.warn('Comic completion sync skipped:', error)
    }

    setProfile((prev) => ({
      ...prev,
      completedComics: Array.from(completedComics),
      achievements: Array.from(achievements),
    }))
    newAchievements.forEach(pushAchievement)
    await awardPlatinum(Array.from(achievements))
    return true
  }

  useEffect(() => {
    if (!currentUser || !profile) return
    if (profile.platinumAwarded) return
    if (!hasAllAchievements(profile.achievements || [])) return
    awardPlatinum(profile.achievements || [])
  }, [currentUser, profile?.achievements, profile?.platinumAwarded])

  const deleteAccount = async () => {
    if (!currentUser) return
    const profileRef = doc(db, 'users', currentUser.uid)
    try {
      await deleteDoc(profileRef)
    } catch (error) {
      // Allow account deletion even if Firestore is offline.
      console.warn('Profile delete skipped:', error)
    }
    await deleteUser(currentUser)
    setProfile(null)
  }

  const reauthenticate = async ({ password }) => {
    if (!currentUser) return
    const providerId = currentUser.providerData?.[0]?.providerId
    if (providerId === 'google.com') {
      const provider = new GoogleAuthProvider()
      await reauthenticateWithPopup(currentUser, provider)
      return
    }
    if (providerId === 'password') {
      if (!password) {
        throw new Error('Password required for reauthentication.')
      }
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password
      )
      await reauthenticateWithCredential(currentUser, credential)
    }
  }

  const value = useMemo(
    () => ({
      currentUser,
      profile,
      loading,
      register,
      signInWithGoogle,
      login,
      logout,
      updateUserProfile,
      uploadAvatar,
      addXp,
      markComicComplete,
      unlockAchievement,
      achievementQueue,
      dismissAchievement,
      deleteAccount,
      reauthenticate,
    }),
    [currentUser, profile, loading, achievementQueue]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const useAuth = () => useContext(AuthContext)

export { AuthProvider, useAuth }
