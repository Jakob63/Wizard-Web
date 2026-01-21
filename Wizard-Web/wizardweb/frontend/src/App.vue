<template>
  <div id="shell">
    <MainPage :user="user" @logout="logout">
      <router-view :refresh-url="refreshUrl" />
    </MainPage>
  </div>
</template>

<script>
import MainPage from './components/MainPage.vue'
import { auth } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'

export default {
  name: 'App',
  components: { MainPage },
  data(){
    return { 
      user: null
    };
  },
  computed: {
    refreshUrl(){
      try {
        const url = new URL(window.location.href);
        return url.searchParams.get('to') || url.searchParams.get('url') || '';
      } catch(_) { return ''; }
    }
  },
  methods: {
    logout() {
      signOut(auth).then(() => {
        this.$router.push('/login');
      });
    }
  },
  mounted(){
    onAuthStateChanged(auth, async (user) => {
      console.log("[DEBUG_LOG] onAuthStateChanged triggered. User authenticated:", !!user);
      if (user) {
        console.log("[DEBUG_LOG] Full Firebase user object:", JSON.stringify({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          providerData: user.providerData,
          photoURL: user.photoURL
        }, null, 2));
        
        const mapUser = (u) => {
          let name = u.displayName;
          
          console.log("[DEBUG_LOG] Mapping user. Initial displayName:", name);
          
          if (!name && u.providerData && u.providerData.length > 0) {
            console.log("[DEBUG_LOG] Checking providerData...");
            const githubData = u.providerData.find(p => p.providerId === 'github.com');
            if (githubData) {
              name = githubData.displayName || githubData.email;
              console.log("[DEBUG_LOG] Found GitHub data. Name candidate:", name);
            }
            if (!name) {
              name = u.providerData[0].displayName || u.providerData[0].email;
              console.log("[DEBUG_LOG] Using first provider data. Name candidate:", name);
            }
          }
          
          if (!name) name = u.email;
          if (!name && u.email) name = u.email.split('@')[0];
          
          if (!name && u.reloadUserInfo) {
             name = u.reloadUserInfo.screenName || u.reloadUserInfo.login;
             console.log("[DEBUG_LOG] Checked reloadUserInfo. Name candidate:", name);
          }

          const result = {
            displayName: name || 'User',
            email: u.email,
            uid: u.uid,
            photoURL: u.photoURL
          };
          console.log("[DEBUG_LOG] Mapped user result:", JSON.stringify(result, null, 2));
          return result;
        };

        this.user = mapUser(user);

        if (this.user.displayName === 'User') {
          console.log("[DEBUG_LOG] Name is still 'User', waiting for potential profile update...");
          try {
            await new Promise(r => setTimeout(r, 2000));
            if (auth.currentUser) {
              console.log("[DEBUG_LOG] Re-mapping auth.currentUser after delay...");
              this.user = mapUser(auth.currentUser);
            }
          } catch (e) {
            console.error("[DEBUG_LOG] Error during re-mapping:", e);
          }
        }
      } else {
        console.log("[DEBUG_LOG] User is null");
        this.user = null;
      }
    });
  }
}
</script>

<style>
#shell { min-height: 100vh; display: flex; flex-direction: column; }
</style>
