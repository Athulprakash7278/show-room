import { createUserWithEmailAndPassword, GoogleAuthProvider, signInwithEmailAndPassword} from 'firebase/auth';
import {auth} from './firebase.jsx';

export const doCreateUserWithEmailAndPassword = async(email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const doSignInWithEmailAndPassword = async(email, password) => {
    return signInwithEmailAndPassword(auth, email, password);
};

export const doSignInWithGoogle = async() => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // result.user
    return result;
};

export const doSignOut = async() => {
    return auth.signOut();
};

// export const doPasswordReset = async(email) => {
//     return sendPasswordResetEmail(auth, email);
// };

// export const doPasswordChange = async(password) => {
//     return updatePassword(auth.currentUser, password);
// };

// export const doSendEmailVerification = async() => {
//     return sendEmailVerification(auth.currentUser, {
//         url: `${window.location.origin}/home`,
//     });
// };