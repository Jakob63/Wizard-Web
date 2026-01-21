import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB8CqVYsbgj2lQHj1frQHJLL25LIISHW7w",
  authDomain: "wizard-web-68a98.firebaseapp.com",
  projectId: "wizard-web-68a98",
  storageBucket: "wizard-web-68a98.firebasestorage.app",
  messagingSenderId: "85510854970",
  appId: "1:85510854970:web:f7b41d93247827303ad803"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

export { auth, githubProvider };
