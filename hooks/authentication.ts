import {User} from '../models/User'
import { atom,useRecoilState } from "recoil";
import firebase from 'firebase/app'
import { useEffect } from "react";

const userState = atom<User>({
  key:'user',
  default: null,
})

export function useAuthentication() {
  const [user, setUser] = useRecoilState(userState)

  useEffect(()=>{
    if(user !== null) {return}
  
    firebase
      .auth()
      .signInAnonymously()
      .catch(function (error) {
        var errorCode = error.code
        var errorMessage = error.message
        console.log(errorCode, errorMessage);
      })

    firebase.auth().onAuthStateChanged(function (firebaseUser) {
      if (firebaseUser) {
        console.log(firebaseUser.uid)
        console.log(firebaseUser.isAnonymous)
        const loginUser: User = {
          uid: firebaseUser.uid,
          isAnonymous: firebaseUser.isAnonymous,
          name : ''
        }
        setUser(loginUser)
        createUserIfNotFound(loginUser)

      } else {
        // User is signed out.
        setUser(null)
      }
    })
  },[])

  return { user }
}



async function createUserIfNotFound(user:User) {
  const userRef = firebase.firestore().collection('users').doc(user.uid)
  const doc = await userRef.get()
  if(doc.exists) return

  await userRef.set({
    name: 'taro' + new Date().getTime()
  })
}

