(this["webpackJsonpmodest-read"]=this["webpackJsonpmodest-read"]||[]).push([[6],{32:function(t,e,n){"use strict";function o(t){document.title=t+" | ModestRead"}function i(...t){return t.join(" ").trimEnd()}async function r(t){const e=await t.getPage(1),n=document.createElement("canvas");let o=e.getViewport({scale:.4});return o.width<162?o=e.getViewport({scale:64.8/o.width}):o.height>240&&(o=e.getViewport({scale:96/o.height})),n.width=o.width,n.height=o.height,await e.render({canvasContext:n.getContext("2d"),viewport:o}).promise,n.toDataURL("image/jpeg",.8)}async function c(t,e){const n=await t.arrayBuffer();return e.getDocument(new Uint8Array(n)).promise}function u(t){const e={};return t.info.Title&&(e.title=t.info.Title),t.info.Author&&(e.author=t.info.Author),e}function a(t){const e=["B","kB","MB","GB"];let n=t,o=0;for(;o<e.length&&!(n<1e3);)n/=1e3,o+=1;return n=o>0?n.toFixed(1):Math.round(n),`${n} ${e[o]}`}function s(t,e,n){for(const o of t)if(parseInt(o.getAttribute("data-page-number"),10)===e)return n(o)}function d(t,e){return s(e,t,(t=>t.getBoundingClientRect()))}function f(t,e,n){s(e,t,(e=>{const o=n||1===t?40:0;window.scrollTo(document.documentElement.scrollLeft,e.offsetTop-o)}))}function l(){const t=document.createElement("div"),e=document.createElement("div");t.style.visibility="hidden",t.style.overflow="scroll",t.appendChild(e),document.body.appendChild(t);const n=t.offsetWidth-e.offsetWidth;return t.remove(),n}n.d(e,"i",(function(){return o})),n.d(e,"a",(function(){return i})),n.d(e,"f",(function(){return r})),n.d(e,"d",(function(){return c})),n.d(e,"g",(function(){return u})),n.d(e,"b",(function(){return a})),n.d(e,"c",(function(){return d})),n.d(e,"h",(function(){return f})),n.d(e,"e",(function(){return l}))},33:function(t,e,n){"use strict";var o=n(3),i=(n(0),n.p+"static/media/icon-text.8d796bce.svg");n(35);e.a=function(){return Object(o.jsx)("img",{src:i,className:"banner-image",alt:""})}},35:function(t,e,n){},71:function(t,e,n){},75:function(t,e,n){"use strict";n.r(e);var o=n(3),i=n(0),r=n(32),c=n(33);n(71);e.default=function({message:t}){return Object(i.useEffect)((()=>{Object(r.i)("Page not found")}),[t]),Object(o.jsxs)("div",{className:"no-match",children:[Object(o.jsx)(c.a,{}),Object(o.jsx)("p",{className:"no-match-message",children:"The page you are looking for does not exist."})]})}}}]);