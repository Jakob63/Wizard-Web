<template>
  <div class="register-container">
    <h2>Registrieren</h2>
    <div v-if="success" class="success-message">
      <h3>Registrierung erfolgreich!</h3>
      <p>Dein Account wurde erstellt. Du kannst dich jetzt einloggen oder zur Startseite gehen.</p>
      <div class="success-actions">
        <button @click="navigate('/login')" class="btn-link">Zum Login</button>
        <button @click="navigate('/')" class="btn-home">Zur Startseite</button>
      </div>
    </div>
    <form v-else @submit.prevent="register">
      <input type="email" v-model="email" placeholder="Email" required />
      <input type="password" v-model="password" placeholder="Passwort" required />
      <button type="submit">Registrieren</button>
    </form>
    
    <div class="silhouette-auth" v-if="!success">
      <hr />
      <h4>Silhouette Registration</h4>
      <input type="text" v-model="silUsername" placeholder="Username" />
      <input type="email" v-model="silEmail" placeholder="Email" />
      <input type="password" v-model="silPassword" placeholder="Passwort" />
      <button @click="registerWithSilhouette" class="btn-silhouette">Mit Silhouette registrieren</button>
      <p v-if="silError" class="error-message">{{ silError }}</p>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
    <p v-if="!success">Bereits einen Account? <router-link to="/login">Login</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const error = ref(null);
const success = ref(false);
const router = useRouter();

// Silhouette State
const silUsername = ref('');
const silEmail = ref('');
const silPassword = ref('');
const silError = ref(null);

const register = async () => {
  try {
    error.value = null;
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    success.value = true;
  } catch (err) {
    error.value = err.message;
  }
};

const registerWithSilhouette = async () => {
  try {
    silError.value = null;
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: silUsername.value,
        email: silEmail.value,
        password: silPassword.value
      })
    });
    
    if (response.ok) {
      success.value = true;
    } else {
      const data = await response.json();
      silError.value = data.error || 'Silhouette Registrierung fehlgeschlagen';
    }
  } catch (err) {
    silError.value = "Netzwerkfehler: " + err.message;
  }
};

const navigate = (path) => {
  router.push(path);
};
</script>

<style scoped>
.register-container {
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
  background-color: #2196F3;
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
.btn-link, .btn-home {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-radius: 4px;
  text-decoration: none;
  font-size: 16px;
  border: none;
  cursor: pointer;
}
.btn-link {
  background-color: #4CAF50;
  color: white;
}
.btn-home {
  background-color: #757575;
  color: white;
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
