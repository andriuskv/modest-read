(this["webpackJsonpmodest-read"]=this["webpackJsonpmodest-read"]||[]).push([[1],{25:function(e,n,t){},30:function(e,n,t){"use strict";t.r(n);var o=t(3),i=t(0),r=t.n(i),c=t(15),s=t.n(c),a=(t(23),t(24),t(25),t(13)),l=t(1);const d=Object(i.lazy)((()=>t.e(5).then(t.bind(null,69)))),h=Object(i.lazy)((()=>Promise.all([t.e(0),t.e(3)]).then(t.bind(null,70)))),u=Object(i.lazy)((()=>t.e(6).then(t.bind(null,71))));function b(){return Object(o.jsx)(a.a,{children:Object(o.jsx)("main",{children:Object(o.jsx)(i.Suspense,{fallback:Object(o.jsx)("div",{}),children:Object(o.jsxs)(l.c,{children:[Object(o.jsx)(l.a,{path:"/",exact:!0,component:d}),Object(o.jsx)(l.a,{path:"/viewer/:id",component:h}),Object(o.jsx)(l.a,{component:u})]})})})})}const j=Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));function w(e,n){navigator.serviceWorker.register(e).then((e=>{e.onupdatefound=()=>{const t=e.installing;null!=t&&(t.onstatechange=()=>{"installed"===t.state&&(navigator.serviceWorker.controller?(console.log("New content is available and will be used when all tabs for this page are closed. See https://bit.ly/CRA-PWA."),n&&n.onUpdate&&n.onUpdate(e)):(console.log("Content is cached for offline use."),n&&n.onSuccess&&n.onSuccess(e)))})}})).catch((e=>{console.error("Error during service worker registration:",e)}))}s.a.render(Object(o.jsx)(r.a.StrictMode,{children:Object(o.jsx)(b,{})}),document.getElementById("root")),function(e){if("serviceWorker"in navigator){if(new URL("/modest-read",window.location.href).origin!==window.location.origin)return;window.addEventListener("load",(()=>{const n="/modest-read/service-worker.js";j?(!function(e,n){fetch(e,{headers:{"Service-Worker":"script"}}).then((t=>{const o=t.headers.get("content-type");404===t.status||null!=o&&-1===o.indexOf("javascript")?navigator.serviceWorker.ready.then((e=>{e.unregister().then((()=>{window.location.reload()}))})):w(e,n)})).catch((()=>{console.log("No internet connection found. App is running in offline mode.")}))}(n,e),navigator.serviceWorker.ready.then((()=>{console.log("This web app is being served cache-first by a service worker. To learn more, visit https://bit.ly/CRA-PWA")}))):w(n,e)}))}}()}},[[30,2,4]]]);