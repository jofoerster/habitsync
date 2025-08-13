self.addEventListener('install', function (e) {
    console.log('Service Worker: Installed');
});

self.addEventListener('fetch', function (event) {
    // Optionally intercept requests
});
