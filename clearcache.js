// clear-cache.js
// Run this in browser console to clear all cache and storage

console.log('🧹 Clearing all browser cache and storage...');

// Clear localStorage
try {
  localStorage.clear();
  console.log('✅ localStorage cleared');
} catch (e) {
  console.error('❌ Error clearing localStorage:', e);
}

// Clear sessionStorage
try {
  sessionStorage.clear();
  console.log('✅ sessionStorage cleared');
} catch (e) {
  console.error('❌ Error clearing sessionStorage:', e);
}

// Clear cookies (limited access from JS)
try {
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  console.log('✅ Cookies cleared');
} catch (e) {
  console.error('❌ Error clearing cookies:', e);
}

// Clear IndexedDB
try {
  if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        indexedDB.deleteDatabase(db.name);
        console.log(`✅ IndexedDB ${db.name} cleared`);
      });
    });
  }
} catch (e) {
  console.error('❌ Error clearing IndexedDB:', e);
}

// Clear Cache Storage
try {
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log(`✅ Cache ${name} cleared`);
      });
    });
  }
} catch (e) {
  console.error('❌ Error clearing caches:', e);
}

console.log('🎉 Cache clearing complete! Please refresh the page.');
console.log('💡 Use Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac) for hard refresh');