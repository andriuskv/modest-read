(this["webpackJsonpmodest-read"]=this["webpackJsonpmodest-read"]||[]).push([[5],{25:function(e,n,o){},30:function(e,n,o){"use strict";o.r(n);var t=o(3),r=o(0),i=o.n(r),c=o(15),a=o.n(c),s=(o(23),o(24),o(25),o(13)),l=o(1);const d=Object(r.lazy)((()=>Promise.all([o.e(2),o.e(8)]).then(o.bind(null,140)))),h=Object(r.lazy)((()=>Promise.all([o.e(2),o.e(9)]).then(o.bind(null,139)))),u=Object(r.lazy)((()=>o.e(10).then(o.bind(null,142))));function b(){return Object(t.jsx)(s.a,{children:Object(t.jsx)("main",{children:Object(t.jsx)(r.Suspense,{fallback:Object(t.jsx)("div",{}),children:Object(t.jsxs)(l.c,{children:[Object(t.jsx)(l.a,{path:"/",exact:!0,component:d}),Object(t.jsx)(l.a,{path:"/viewer/:id",component:h}),Object(t.jsx)(l.a,{component:u})]})})})})}const j=Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));function w(e,n){navigator.serviceWorker.register(e).then((e=>{e.onupdatefound=()=>{const o=e.installing;null!=o&&(o.onstatechange=()=>{"installed"===o.state&&(navigator.serviceWorker.controller?(console.log("New content is available and will be used when all tabs for this page are closed. See https://cra.link/PWA."),n&&n.onUpdate&&n.onUpdate(e)):(console.log("Content is cached for offline use."),n&&n.onSuccess&&n.onSuccess(e)))})}})).catch((e=>{console.error("Error during service worker registration:",e)}))}a.a.render(Object(t.jsx)(i.a.StrictMode,{children:Object(t.jsx)(b,{})}),document.getElementById("root")),function(e){if("serviceWorker"in navigator){if(new URL("/modest-read",window.location.href).origin!==window.location.origin)return;window.addEventListener("load",(()=>{const n="/modest-read/service-worker.js";j?(!function(e,n){fetch(e,{headers:{"Service-Worker":"script"}}).then((o=>{const t=o.headers.get("content-type");404===o.status||null!=t&&-1===t.indexOf("javascript")?navigator.serviceWorker.ready.then((e=>{e.unregister().then((()=>{window.location.reload()}))})):w(e,n)})).catch((()=>{console.log("No internet connection found. App is running in offline mode.")}))}(n,e),navigator.serviceWorker.ready.then((()=>{console.log("This web app is being served cache-first by a service worker. To learn more, visit https://cra.link/PWA")}))):w(n,e)}))}}()}},[[30,6,7]]]);