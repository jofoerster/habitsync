import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="en">
        <head>
            <meta charSet="utf-8" />
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

            {/* PWA meta tags */}
            <meta name="theme-color" content="#1976d2" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="HabitSync" />
            <link rel="apple-touch-icon" href="/icon-192x192.png" />

            {/* Runtime configuration injected by Docker at startup */}
            <script src="/config.js"></script>

            {/* Link the PWA manifest file. */}
            <link rel="manifest" href="/manifest.json" />

            {/* Service Worker Registration */}
            <script dangerouslySetInnerHTML={{
                __html: `
                    if ('serviceWorker' in navigator) {
                        window.addEventListener('load', function() {
                            navigator.serviceWorker.register('/sw.js')
                                .then(function(registration) {
                                    console.log('[App] ServiceWorker registered:', registration.scope);
                                    
                                    // Check for updates periodically
                                    setInterval(function() {
                                        registration.update();
                                    }, 60 * 60 * 1000); // Check every hour
                                })
                                .catch(function(error) {
                                    console.log('[App] ServiceWorker registration failed:', error);
                                });
                        });
                    }
                `
            }} />

            {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
            <ScrollViewStyleReset />

            {/* Add any additional <head> elements that you want globally available on web... */}
        </head>
        <body>{children}</body>
        </html>
    );
}
