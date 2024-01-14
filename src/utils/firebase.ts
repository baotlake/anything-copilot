import { initializeApp } from "firebase/app"
import {
  activate,
  fetchAndActivate,
  getRemoteConfig,
  getValue,
  isSupported,
} from "firebase/remote-config"

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  // The value of `databaseURL` depends on the location of the database
  // databaseURL: "https://DATABASE_NAME.firebaseio.com",
  // For Firebase JavaScript SDK v7.20.0 and later, `measurementId` is an optional field
  // measurementId: "G-MEASUREMENT_ID",

  apiKey: "AIzaSyBkNIquKSxOfJxZErQtlIr--Ae-c4ZXZzg",
  authDomain: "anything-copilot.firebaseapp.com",
  projectId: "anything-copilot",
  storageBucket: "anything-copilot.appspot.com",
  messagingSenderId: "303124265017",
  appId: "1:303124265017:web:92ce306c269fde39e175e8",
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Remote Config and get a reference to the service
export const remoteConfig = getRemoteConfig(app)

remoteConfig.settings.minimumFetchIntervalMillis = 3600000

export async function testFirebase() {  
  const supported = await isSupported()
  const fetched = await fetchAndActivate(remoteConfig)
  const activated = await activate(remoteConfig)

  console.log("fetchAndActivate", supported, fetched, activated)

  const a = getValue(remoteConfig, "tmp_test")

  console.log(a)
}
