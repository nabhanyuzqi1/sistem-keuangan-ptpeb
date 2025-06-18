// browser-test.js
// Copy paste this entire script to browser console to test auth and firestore

console.log('🔍 Starting PT PEB Auth Debug...\n');

// Function to test Firebase Auth
async function testAuth() {
  console.log('1️⃣ Testing Firebase Auth...');
  
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase not loaded!');
    return false;
  }
  
  const auth = firebase.auth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ No user logged in!');
    console.log('💡 Please login first');
    return false;
  }
  
  console.log('✅ User is logged in:');
  console.log('   Email:', user.email);
  console.log('   UID:', user.uid);
  console.log('   Email Verified:', user.emailVerified);
  
  return user;
}

// Function to test Firestore
async function testFirestore(user) {
  console.log('\n2️⃣ Testing Firestore...');
  
  if (!user) return;
  
  try {
    const db = firebase.firestore();
    
    // Try to find user by email
    console.log('   Searching users collection by email...');
    const querySnapshot = await db.collection('users')
      .where('email', '==', user.email)
      .get();
    
    if (querySnapshot.empty) {
      console.error('❌ No user document found with email:', user.email);
      return null;
    }
    
    console.log('✅ Found', querySnapshot.size, 'user document(s):');
    
    querySnapshot.forEach((doc) => {
      console.log('   Document ID:', doc.id);
      console.log('   Data:', doc.data());
    });
    
    const userData = querySnapshot.docs[0].data();
    return userData;
    
  } catch (error) {
    console.error('❌ Firestore error:', error);
    return null;
  }
}

// Function to check current app state
function checkAppState() {
  console.log('\n3️⃣ Checking App State...');
  
  // Check if React DevTools is available
  const reactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (reactDevTools) {
    console.log('✅ React DevTools detected');
  } else {
    console.log('⚠️ React DevTools not detected - install React DevTools extension for better debugging');
  }
  
  // Check localStorage
  console.log('\n4️⃣ Checking localStorage...');
  const keys = Object.keys(localStorage);
  if (keys.length > 0) {
    console.log('   Found', keys.length, 'items in localStorage');
    keys.forEach(key => {
      if (key.includes('firebase') || key.includes('auth')) {
        console.log('   -', key);
      }
    });
  } else {
    console.log('   localStorage is empty');
  }
}

// Function to force update user role
async function forceAdminRole() {
  console.log('\n5️⃣ Attempting to force admin role...');
  
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error('❌ No user logged in!');
    return;
  }
  
  if (user.email === 'permataenergiborneo@gmail.com') {
    console.log('✅ This is the admin email!');
    console.log('💡 If admin features are not showing:');
    console.log('   1. Clear all cache and cookies');
    console.log('   2. Logout and login again');
    console.log('   3. Hard refresh (Ctrl+Shift+R)');
    
    // Try to manually trigger a state update
    console.log('\n🔄 Triggering page reload...');
    setTimeout(() => {
      window.location.reload(true);
    }, 2000);
  } else {
    console.log('⚠️ Current email is not admin:', user.email);
  }
}

// Main execution
async function runDebug() {
  const user = await testAuth();
  if (user) {
    const userData = await testFirestore(user);
    checkAppState();
    
    if (userData) {
      console.log('\n📊 Summary:');
      console.log('   Email:', userData.email);
      console.log('   Name:', userData.name);
      console.log('   Role:', userData.role);
      console.log('   Is Admin?', userData.role === 'admin' ? '✅ YES' : '❌ NO');
      
      if (userData.role === 'admin') {
        console.log('\n✅ User SHOULD have admin access!');
        console.log('💡 If admin features are not visible, try:');
        console.log('   1. Press F5 to refresh');
        console.log('   2. Run: location.reload(true)');
        console.log('   3. Clear cache and login again');
      }
    }
    
    await forceAdminRole();
  }
}

// Run the debug
runDebug();