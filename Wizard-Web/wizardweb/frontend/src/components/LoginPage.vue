<template>
  <div class="login-container">
    <h2>Login</h2>
    <div v-if="success" class="success-message">
      <h3>Login erfolgreich!</h3>
      <p>Willkommen zurück! Du bist nun eingeloggt.</p>
      <div class="success-actions">
        <button @click="navigate('/')" class="btn-home">Zur Startseite</button>
      </div>
    </div>
    <form v-else @submit.prevent="login">
      <input type="email" v-model="email" placeholder="Email" required />
      <input type="password" v-model="password" placeholder="Passwort" required />
      <button type="submit">Login</button>
      <button type="button" @click="loginWithGithub" class="btn-github">Mit GitHub anmelden</button>
    </form>
    
    <div class="silhouette-auth" v-if="!success">
      <hr />
      <h4>Silhouette Login</h4>
      <input type="text" v-model="silUsername" placeholder="Username" />
      <input type="password" v-model="silPassword" placeholder="Passwort" />
      <button @click="loginWithSilhouette" class="btn-silhouette">Mit Silhouette einloggen</button>
      <p v-if="silError" class="error-message">{{ silError }}</p>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
    <p v-if="!success">Noch keinen Account? <router-link to="/register">Registrieren</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { auth, githubProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GithubAuthProvider, updateProfile } from 'firebase/auth';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const error = ref(null);
const success = ref(false);
const router = useRouter();

// Silhouette State
const silUsername = ref('');
const silPassword = ref('');
const silError = ref(null);

const login = async () => {
  try {
    error.value = null;
    await signInWithEmailAndPassword(auth, email.value, password.value);
    success.value = true;
  } catch (err) {
    error.value = err.message;
  }
};

const loginWithSilhouette = async () => {
  try {
    silError.value = null;
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: silUsername.value,
        password: silPassword.value
      })
    });
    
    if (response.ok) {
      success.value = true;
    } else {
      const data = await response.json();
      silError.value = data.error || 'Silhouette Login fehlgeschlagen';
    }
  } catch (err) {
    silError.value = "Netzwerkfehler: " + err.message;
  }
};

const loginWithGithub = async () => {
  try {
    error.value = null;
    const result = await signInWithPopup(auth, githubProvider);
    const user = result.user;
    
    console.log("[DEBUG_LOG] GitHub Login Result User:", JSON.stringify(user, null, 2));
    
    // Versuch 1: screenName aus den zusätzlichen Informationen (oft in reloadUserInfo versteckt)
    // In der Web SDK v9+ ist es oft nicht direkt zugänglich, aber wir können den Token nutzen
    const credential = GithubAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    
    if (token) {
      console.log("[DEBUG_LOG] GitHub Token found, fetching user info from API...");
      const response = await fetch("https://api.github.com/user", {
        headers: { Authorization: `token ${token}` }
      });
      const githubData = await response.json();
      console.log("[DEBUG_LOG] GitHub API Data:", JSON.stringify(githubData, null, 2));
      
      const username = githubData.login; // Das ist der eigentliche Username (z.B. "Lymeaaa")
      
      if (username && !user.displayName) {
        console.log("[DEBUG_LOG] Updating Firebase profile with GitHub username:", username);
        await updateProfile(user, { displayName: username });
        // Force reload to make sure the changes are reflected in the auth object
        await user.reload();
        console.log("[DEBUG_LOG] User reloaded after profile update. New displayName:", auth.currentUser.displayName);
        // Wir setzen success.value erst nachdem wir sicher sind, dass das Profil aktualisiert wurde
        success.value = true;
      }
    } else {
      success.value = true;
    }
  } catch (err) {
    console.error("[DEBUG_LOG] GitHub Login Error:", err);
    error.value = err.message;
  }
};

const navigate = (path) => {
  router.push(path);
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
input {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
}
button {
  width: 100%;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  margin-top: 10px;
}
.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}
.error-message {
  color: #d32f2f;
  margin-top: 10px;
}
.success-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}
.btn-home {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-radius: 4px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
}
.btn-github {
  background-color: #333;
  color: white;
  border: none;
  cursor: pointer;
  margin-top: 10px;
}
.silhouette-auth {
  margin-top: 20px;
  text-align: left;
}
.silhouette-auth h4 {
  margin-bottom: 10px;
  color: #666;
}
.btn-silhouette {
  background-color: #673AB7;
  color: white;
  border: none;
  cursor: pointer;
  width: 100%;
  padding: 10px;
  margin-top: 5px;
}
</style>
