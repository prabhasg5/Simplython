// Google sign-in + progress saved in Firestore (one document per child: progress/{uid}).
import { firebaseConfig } from "./firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2";
export const cloudEnabled = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "PASTE_ME";

let A, F, auth, db, user = null, pending = null, timer = null;

/** Calls onUser({ uid, name, data }) after sign-in (data = saved progress JSON or null), onUser(null) when signed out. */
export async function initCloud(onUser) {
  const [{ initializeApp }, a, f] = await Promise.all([
    import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-firestore.js`),
  ]);
  A = a; F = f;
  const app = initializeApp(firebaseConfig);
  auth = A.getAuth(app);
  db = F.getFirestore(app);
  A.onAuthStateChanged(auth, async (u) => {
    user = u;
    if (!u) return onUser(null);
    const snap = await F.getDoc(F.doc(db, "progress", u.uid));
    onUser({ uid: u.uid, name: u.displayName || "", data: snap.exists() ? snap.data().data : null });
  });
}

export const signIn = () => A.signInWithPopup(auth, new A.GoogleAuthProvider());
export async function signOut() { await flushCloud(); await A.signOut(auth); }

/** Saves at most every 2 seconds (the code editor saves on every keystroke). */
export function saveCloud(json) {
  if (!user) return;
  pending = json;
  timer ||= setTimeout(flushCloud, 2000);
}
export async function flushCloud() {
  clearTimeout(timer);
  timer = null;
  if (!user || pending === null) return;
  const data = pending;
  pending = null;
  try {
    await F.setDoc(F.doc(db, "progress", user.uid), { data, updated: F.serverTimestamp() });
  } catch (e) {
    console.warn("Cloud save failed, will retry on next save", e);
    pending ??= data;
  }
}
