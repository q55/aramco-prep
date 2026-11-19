# Aramco Prep: standalone site setup

The site runs on GitHub Pages. Sign-in and saved progress use Firebase (free plan).

## 1. Firebase (about 5 minutes)
1. Go to https://console.firebase.google.com and click **Create a project**. Name it `aramco-prep`. Google Analytics is not needed.
2. **Build → Authentication → Get started.** Under **Sign-in method**, turn on:
   - **Google**
   - **Email/Password**
3. **Build → Firestore Database → Create database.** Choose a location (for example `europe-west`) and **production mode**.
4. Open the **Rules** tab, paste the contents of `firestore.rules`, and click **Publish**.
5. **Project settings (⚙) → General → Your apps → Web (`</>`).** Register an app called `aramco-prep`. Firebase Hosting is not needed.
6. Copy the `firebaseConfig` object it shows. It is not a secret; it is meant to be in the page.
7. **Authentication → Settings → Authorized domains → Add domain:** `q55.github.io`

## 2. firebase-config.js
Replace its content with:
```js
window.FB_CONFIG = { apiKey: "...", authDomain: "...", projectId: "...", storageBucket: "...", messagingSenderId: "...", appId: "..." };
```

## 3. GitHub Pages
1. Push this folder to a repository, for example `q55/aramco-prep`.
2. **Settings → Pages → Source:** Deploy from a branch, `main`, `/ (root)`.
3. The site goes live at https://q55.github.io/aramco-prep/

## How saving works
- **Not signed in:** progress is saved on that device only.
- **Signed in:** progress is saved to that person's account, and they can continue on any device. Firestore rules let each person read and write only their own document.
- **Signing out** removes that person's progress from the device, so the next person on a shared device starts clean.
