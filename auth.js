// Account sign-in and progress sync for the standalone site (Firebase Auth + Firestore).
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,
  createUserWithEmailAndPassword,sendPasswordResetEmail,signOut} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const OWNER='aramcoPrep_owner';
Object.assign(AR,{
  'Sign in':'تسجيل الدخول','Sign out':'تسجيل الخروج','Continue with Google':'الدخول بحساب Google','or':'أو',
  'Email':'الإيميل','Password':'كلمة المرور','Create account':'حساب جديد','Forgot password?':'نسيت كلمة المرور؟',
  'Close':'إغلاق','Sign in to save your progress to your account and continue on any device.':'سجّل دخولك عشان ينحفظ تقدمك في حسابك وتكمل من أي جهاز.',
  'Sign in to save your progress.':'سجّل دخولك عشان ينحفظ تقدمك.',
  'Reset link sent. Check your email.':'أرسلنا رابط تغيير كلمة المرور على إيميلك.',
  'Enter your email first.':'اكتب إيميلك أول.','Wrong email or password.':'الإيميل أو كلمة المرور غلط.',
  'This email already has an account. Sign in instead.':'هذا الإيميل عنده حساب. سجّل دخول بدال.',
  'Password must be at least 6 characters.':'كلمة المرور لازم تكون 6 أحرف أو أكثر.',
  'Enter a valid email.':'اكتب إيميل صحيح.','Something went wrong. Try again.':'صار خطأ. جرّب مرة ثانية.',
  'Signed in as':'داخل باسم','Loading your progress…':'جاري تحميل تقدمك…'
});

const app=initializeApp(window.FB_CONFIG),auth=getAuth(app),fdb=getFirestore(app);

// ---- UI ----
const btn=document.createElement('button');btn.id='acctBtn';btn.type='button';
document.querySelector('.qtog').prepend(btn);
const dlg=document.createElement('dialog');dlg.id='authDlg';
dlg.innerHTML=`<form method="dialog" class="ad" novalidate>
 <button type="button" class="adx" data-act="close" aria-label="Close">✕</button>
 <h2 data-a="Sign in"></h2><p class="adp" data-a="Sign in to save your progress to your account and continue on any device."></p>
 <div class="adin" hidden><p class="adp"><b id="adWho" dir="ltr"></b></p>
  <button type="button" class="hbtn" data-act="out" data-a="Sign out"></button></div>
 <div class="adout">
  <button type="button" class="hbtn adg" data-act="google"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/></svg><span data-a="Continue with Google"></span></button>
  <div class="ador"><span data-a="or"></span></div>
  <label><span data-a="Email"></span><input id="adEm" type="email" autocomplete="email" dir="ltr" required></label>
  <label><span data-a="Password"></span><input id="adPw" type="password" autocomplete="current-password" dir="ltr" minlength="6" required></label>
  <p class="aderr" id="adErr" role="alert"></p>
  <div class="adrow"><button type="button" class="hbtn hpri" data-act="in" data-a="Sign in"></button><button type="button" class="hbtn" data-act="new" data-a="Create account"></button></div>
  <button type="button" class="adlink" data-act="reset" data-a="Forgot password?"></button>
 </div></form>`;
document.body.append(dlg);
const st=document.createElement('style');st.textContent=`
#acctBtn{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block!important}
#authDlg{border:1px solid var(--line);border-radius:16px;background:var(--card);color:var(--ink);padding:0;width:min(400px,92vw)}
#authDlg::backdrop{background:rgba(0,0,0,.5)}
.ad{padding:22px;display:flex;flex-direction:column;gap:12px;position:relative;font-family:var(--font)}
.ad h2{margin:0;font-size:20px}.adp{margin:0;color:var(--muted);font-size:14px;line-height:1.6}
.adx{position:absolute;inset-inline-end:12px;top:12px;background:none;border:0;color:var(--muted);font-size:16px;padding:4px 8px;cursor:pointer}
.adout,.adin{display:flex;flex-direction:column;gap:12px}.adout[hidden],.adin[hidden]{display:none}
.ad label{display:flex;flex-direction:column;gap:4px;font-size:13px;font-weight:600}
.ad input{font:15px var(--font);padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink)}
.ad input:focus{outline:2px solid var(--accent);outline-offset:0}
.adg{display:flex;align-items:center;justify-content:center;gap:10px}
.ador{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:13px}.ador::before,.ador::after{content:"";flex:1;border-top:1px solid var(--line)}
.adrow{display:grid;grid-template-columns:1fr 1fr;gap:8px}.adrow .hbtn{padding:10px}
.aderr{margin:0;min-height:0;color:#e5534b;font-size:13px}.aderr:empty{display:none}
:root[data-theme=dark] #authDlg .hpri{color:#06201c}
.adlink{background:none;border:0;color:var(--accent);font:500 13px var(--font);cursor:pointer;padding:0;align-self:flex-start}`;
document.head.append(st);

function L(){dlg.querySelectorAll('[data-a]').forEach(e=>{e.textContent=t(e.dataset.a)});dlg.querySelector('.adx').setAttribute('aria-label',t('Close'));paintBtn();}
function paintBtn(){const u=auth.currentUser;btn.textContent=u?(u.displayName?u.displayName.split(' ')[0]:(u.email||'').split('@')[0]):t('Sign in');}
function err(m){dlg.querySelector('#adErr').textContent=m?t(m):'';}
const _rr=window.rerenderAll;window.rerenderAll=function(){_rr&&_rr();L();};
const _tl=window.toggleLang;window.toggleLang=function(){_tl();L();};
btn.onclick=()=>{err('');const u=auth.currentUser;dlg.querySelector('.adin').hidden=!u;dlg.querySelector('.adout').hidden=!!u;
  dlg.querySelector('h2').textContent=t(u?'Signed in as':'Sign in');dlg.querySelector('h2+.adp').hidden=!!u;if(u)dlg.querySelector('#adWho').textContent=u.email||u.displayName||'';dlg.showModal();};
const MSG={'auth/invalid-credential':'Wrong email or password.','auth/wrong-password':'Wrong email or password.','auth/user-not-found':'Wrong email or password.',
 'auth/email-already-in-use':'This email already has an account. Sign in instead.','auth/weak-password':'Password must be at least 6 characters.',
 'auth/invalid-email':'Enter a valid email.','auth/missing-password':'Password must be at least 6 characters.'};
dlg.addEventListener('click',async e=>{
  const a=e.target.closest('[data-act]')?.dataset.act;if(!a)return;
  if(a==='close')return dlg.close();
  const em=dlg.querySelector('#adEm').value.trim(),pw=dlg.querySelector('#adPw').value;err('');
  try{
    if(a==='google')await signInWithPopup(auth,new GoogleAuthProvider());
    else if(a==='in')await signInWithEmailAndPassword(auth,em,pw);
    else if(a==='new')await createUserWithEmailAndPassword(auth,em,pw);
    else if(a==='reset'){if(!em)return err('Enter your email first.');await sendPasswordResetEmail(auth,em);return err('Reset link sent. Check your email.');}
    else if(a==='out'){await signOut(auth);}
    dlg.close();
  }catch(x){if(x.code==='auth/popup-closed-by-user'||x.code==='auth/cancelled-popup-request')return;err(MSG[x.code]||'Something went wrong. Try again.');}
});
dlg.querySelector('#adPw').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();dlg.querySelector('[data-act=in]').click();}});

// ---- sync ----
function fresh(){return {saved:{num:[],ver:[],ind:[]},hist:{num:{},ver:{},ind:{}},prog:{},lim:{},t:0,srs:{},time:{},notes:{},prefs:STATE.prefs||{}};}
function redraw(){try{refreshHome();rerenderAll();}catch(e){}}
syncMsg='Sign in to save your progress.';paintSync();L();
onAuthStateChanged(auth,async u=>{
  if(!u){
    cloudDoc=null;
    if(localStorage.getItem(OWNER)){ // was signed in: clear that person's data from this device
      localStorage.removeItem(OWNER);STATE=fresh();try{localStorage.setItem(LSK,JSON.stringify(STATE))}catch(e){}redraw();}
    syncMsg='Sign in to save your progress.';paintSync();paintBtn();return;}
  syncMsg='Loading your progress…';paintSync();paintBtn();
  const owner=localStorage.getItem(OWNER);
  if(owner&&owner!==u.uid)STATE=fresh(); // another account's leftovers
  localStorage.setItem(OWNER,u.uid);
  const ref=doc(fdb,'users',u.uid);
  try{
    const snap=await getDoc(ref);
    if(snap.exists()){const r=JSON.parse(snap.data().json||'{}');STATE=mergeState(STATE,r);}
    try{localStorage.setItem(LSK,JSON.stringify(STATE))}catch(e){}
    cloudDoc={set:o=>setDoc(ref,{...o,updated:Date.now()})};
    syncMsg='Saved to your account and this device';dirty=true;flush();
  }catch(e){syncMsg='Saved on this device (account sync failed, will retry)';}
  redraw();paintSync();paintBtn();
});
