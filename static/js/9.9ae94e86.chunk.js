(this["webpackJsonpmodest-read"]=this["webpackJsonpmodest-read"]||[]).push([[9],{139:function(e,t,n){"use strict";n.r(t);var i=n(3),o=n(0),a=n(1),s=n(36),c=n(41),r=n(57);const l=Object(r.a)("ModestKeep2","current-file");function d(){return Object(r.c)("file",l)}async function u(e){const t=await d();(null===t||void 0===t?void 0:t.name)!==e.name&&Object(r.f)("file",e,l)}var m=n(38),b=n(32),v=n(13),f=n(47),h=n(40),p=n(71),w=(n(83),n.p+"static/media/ring.a86521a9.svg");var j=function(){return Object(i.jsx)("div",{className:"viewer-spinner-mask",children:Object(i.jsx)("img",{src:w,alt:""})})};n(84);var g=function({file:e,loading:t,notification:n,dismissNotification:o,handleFileUpload:a,loadPreviewFile:s}){return Object(i.jsxs)("div",{className:"viewer-file-preview-container",children:[Object(i.jsx)(h.a,{}),Object(i.jsxs)("div",{className:"viewer-file-preview",children:["negative"===(null===n||void 0===n?void 0:n.type)&&Object(i.jsx)(f.a,{notification:n,margin:"bottom",dismiss:o}),Object(i.jsxs)(p.a,{file:e,children:[Object(i.jsx)(v.b,{to:"/",className:"btn icon-btn",title:"Back to files",children:Object(i.jsx)(b.a,{name:"bookshelf",size:"24px"})}),Object(i.jsxs)("label",{className:"btn viewer-file-preview-import-btn",children:[Object(i.jsx)("input",{type:"file",onChange:a,className:"sr-only",accept:"application/pdf, application/epub+zip"}),Object(i.jsx)("span",{children:"Select File"})]})]}),"warning"===(null===n||void 0===n?void 0:n.type)&&Object(i.jsxs)("div",{className:"viewer-file-preview-warning",children:[Object(i.jsxs)("div",{className:"viewer-file-preview-warning-main",children:[Object(i.jsx)(b.a,{name:"info",className:"viewer-file-preview-warning-icon",size:"24px"}),Object(i.jsx)("p",{className:"viewer-file-preview-warning-message",children:n.value})]}),Object(i.jsxs)("div",{className:"viewer-file-preview-warning-bottom",children:[Object(i.jsx)("button",{className:"btn text-btn viewer-file-preview-warning-btn",onClick:o,children:"No"}),Object(i.jsx)("button",{className:"btn viewer-file-preview-warning-btn",onClick:s,children:"Yes"})]})]}),t&&Object(i.jsx)(j,{})]})]})},x=n(46);n(85);var y=function({file:e}){return Object(i.jsxs)(x.a,{toggle:{content:Object(i.jsx)(b.a,{name:"info"}),title:"Information",className:"btn icon-btn icon-btn-alt"},body:{className:"file-info"},children:[Object(i.jsx)("div",{className:"file-info-image-container",children:Object(i.jsx)("img",{src:e.coverImage,className:"file-info-image",alt:""})}),Object(i.jsxs)("div",{className:"file-info-items",children:[function(){let t="";return e.title?(t=e.title,e.author&&(t+=` by ${e.author}`)):t=e.name,Object(i.jsxs)(i.Fragment,{children:[Object(i.jsx)("div",{className:"file-info-item file-info-title"+(t===e.name?" filename":""),children:t}),t!==e.name&&Object(i.jsx)("div",{className:"file-info-item file-info-filename",children:e.name})]})}(),Object(i.jsxs)("div",{className:"file-info-item file-info-secondary",children:[Object(i.jsxs)("span",{children:[e.pageCount," pages"]}),Object(i.jsx)("span",{children:e.sizeString}),Object(i.jsx)("span",{children:e.type})]})]})]})};n(86);var O=function({file:e,filePreferences:t,setViewerSettings:n,updateFileSavePreference:a,handleFileUpload:s,exitViewer:c}){const[r,l]=Object(o.useState)((()=>Object(m.b)())),d=Object(o.useRef)(!1),u=Object(o.useRef)(e.scrollTop),v=Object(o.useRef)(e.scrollTop>0),f=Object(o.useRef)(null),h=Object(o.useRef)(0),p=Object(o.useRef)(!1),w=Object(o.useRef)(!1),j=Object(o.useRef)(!1),g=Object(o.useCallback)((function(){if(p.current)return;p.current=!0,requestAnimationFrame((()=>{const{scrollTop:e}=document.documentElement;if(e>u.current)d.current?d.current=!1:j.current||L();else if(!e||h.current>100)E();else{const t=u.current-e;h.current+=t}u.current=e,p.current=!1}))}),[e.viewMode]),O=Object(o.useCallback)((function(){if(p.current)return;p.current=!0,requestAnimationFrame((()=>{const{scrollTop:t}=document.documentElement;t<80?"multi"===e.viewMode&&E():v.current?L():"multi"===e.viewMode&&E(),p.current=!1}))}),[e.viewMode]);function E(){var e;(null===(e=f.current)||void 0===e?void 0:e.classList.contains("hidden"))&&(h.current=0,f.current.classList.remove("hidden"),setTimeout((()=>{f.current.classList.remove("hiding")}),200))}function L(){var e;(null===(e=f.current)||void 0===e?void 0:e.classList.contains("hidden"))||(h.current=0,f.current.classList.add("hiding"),setTimeout((()=>{f.current.classList.add("hidden")}),200))}function k(e){w.current||(w.current=!0,requestAnimationFrame((()=>{e.clientY<80&&e.clientX<document.documentElement.clientWidth?(j.current=!0,f.current.classList.contains("hidden")&&(f.current.classList.remove("hidden"),setTimeout((()=>{f.current.classList.remove("hiding")}),200))):j.current=!1,w.current=!1})))}function N({target:t}){t.closest(".viewer-toolbar")||t.closest(".btn")||t.closest("#js-viewer-outline")||(d.current=!1,"multi"===e.viewMode&&document.documentElement.scrollTop<40?v.current=!v.current:f.current.classList.contains("hidden")?(v.current=!1,E()):(v.current=!0,L()))}function T({target:e}){var t,i;t=e.name,i=e.checked,n(t,i),l({...r,[t]:i}),Object(m.c)(t,i)}return Object(o.useEffect)((()=>{if("epub"===e.type)return;return matchMedia("only screen and (hover: none) and (pointer: coarse)").matches?(f.current.classList.toggle("hiding",e.scrollTop>0),f.current.classList.toggle("hidden",e.scrollTop>0),window.addEventListener("pointerup",N),window.addEventListener("scroll",O),()=>{window.removeEventListener("pointerup",N),window.removeEventListener("scroll",O)}):(window.addEventListener("scroll",g),window.addEventListener("mousemove",k),()=>{window.removeEventListener("scroll",g),window.removeEventListener("mousemove",k)})}),[g,O]),Object(i.jsxs)("div",{className:"viewer-toolbar"+(r.keepToolbarVisible?" keep-visible":""),ref:f,children:[Object(i.jsxs)("div",{className:"view-toolbar-side",children:[Object(i.jsx)(y,{file:e}),Object(i.jsx)("button",{id:"js-viewer-outline-toggle-btn",className:"btn icon-btn viewer-outline-toggle-btn",title:"Toggle outline",children:Object(i.jsx)(b.a,{name:"outline"})}),Object(i.jsxs)("div",{className:"viewer-toolbar-zoom",children:[Object(i.jsx)("button",{id:"js-viewer-zoom-out",className:"btn icon-btn viewer-toolbar-tool-btn",title:"Zoom out",children:Object(i.jsx)(b.a,{name:"minus"})}),Object(i.jsxs)("select",{id:"js-viewer-scale-select",className:"input viewer-toolbar-zoom-select",children:[Object(i.jsx)("option",{value:"custom",style:{display:"none"}}),"pdf"===e.type&&Object(i.jsx)("option",{value:"fit-width",children:"Fit Width"}),"pdf"===e.type&&Object(i.jsx)("option",{value:"fit-page",children:"Fit Page"}),Object(i.jsx)("option",{value:"0.5",children:"50%"}),Object(i.jsx)("option",{value:"0.75",children:"75%"}),Object(i.jsx)("option",{value:"1",children:"100%"}),Object(i.jsx)("option",{value:"1.5",children:"150%"}),Object(i.jsx)("option",{value:"2",children:"200%"}),Object(i.jsx)("option",{value:"3",children:"300%"}),Object(i.jsx)("option",{value:"4",children:"400%"})]}),Object(i.jsx)("button",{id:"js-viewer-zoom-in",className:"btn icon-btn viewer-toolbar-tool-btn",title:"Zoom in",children:Object(i.jsx)(b.a,{name:"plus"})})]})]}),Object(i.jsxs)("div",{className:"view-toolbar-side",children:[Object(i.jsxs)("div",{className:"viewer-toolbar-page",children:[Object(i.jsx)("button",{id:"js-viewer-previous-page",className:"btn icon-btn viewer-toolbar-tool-btn",children:Object(i.jsx)(b.a,{name:"arrow-up"})}),Object(i.jsxs)("div",{id:"js-viewer-page-input-container",className:"viewer-toolbar-page-input-container",children:[Object(i.jsx)("input",{id:"js-viewer-page-input",type:"text",inputMode:"numeric",className:"input viewer-toolbar-page-input"}),Object(i.jsx)("span",{})]}),Object(i.jsx)("button",{id:"js-viewer-next-page",className:"btn icon-btn viewer-toolbar-tool-btn",children:Object(i.jsx)(b.a,{name:"arrow-down"})})]}),Object(i.jsxs)(x.a,{toggle:{content:Object(i.jsx)(b.a,{name:"dots-vertical"}),title:"More",className:"btn icon-btn icon-btn-alt"},body:{className:"viewer-toolbar-dropdown"},children:[Object(i.jsx)("div",{className:"viewer-toolbar-dropdown-group",children:Object(i.jsxs)("label",{className:"btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn",children:[Object(i.jsx)(b.a,{name:"upload"}),Object(i.jsx)("span",{children:"Load File"}),Object(i.jsx)("input",{type:"file",onChange:s,className:"sr-only",accept:"application/pdf, application/epub+zip"})]})}),"pdf"===e.type&&Object(i.jsx)("div",{className:"viewer-toolbar-dropdown-group",children:Object(i.jsxs)("button",{id:"js-viewer-rotate-btn",className:"btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn",children:[Object(i.jsx)(b.a,{name:"rotate"}),Object(i.jsx)("span",{children:"Rotate pages"})]})}),Object(i.jsxs)("div",{id:"js-viewer-view-modes",className:"viewer-toolbar-dropdown-group",children:["pdf"===e.type&&Object(i.jsxs)("button",{className:"btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn viewer-view-mode-btn","data-mode":"multi",children:[Object(i.jsx)(b.a,{name:"pages"}),Object(i.jsx)("span",{children:"Multi page"})]}),Object(i.jsxs)("button",{className:"btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn viewer-view-mode-btn","data-mode":"single",children:[Object(i.jsx)(b.a,{name:"page"}),Object(i.jsx)("span",{children:"Single page"})]}),"epub"===e.type&&Object(i.jsxs)("button",{className:"btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn viewer-view-mode-btn","data-mode":"spread",children:[Object(i.jsx)(b.a,{name:"spread"}),Object(i.jsx)("span",{children:"Spread page"})]})]}),"epub"===e.type&&Object(i.jsxs)("div",{id:"js-viewer-themes",className:"viewer-toolbar-dropdown-group viewer-themes-container",children:[Object(i.jsx)("div",{className:"viewer-themes-title",children:"Themes"}),Object(i.jsxs)("div",{className:"viewer-themes",children:[Object(i.jsx)("button",{className:"btn viewer-theme-btn black","data-theme":"black",children:"A"}),Object(i.jsx)("button",{className:"btn viewer-theme-btn white","data-theme":"white",children:"A"}),Object(i.jsx)("button",{className:"btn viewer-theme-btn grey","data-theme":"grey",children:"A"}),Object(i.jsx)("button",{className:"btn viewer-theme-btn orange","data-theme":"orange",children:"A"})]})]}),Object(i.jsxs)("div",{className:"viewer-toolbar-dropdown-group viewer-toolbar-settings",children:["pdf"===e.type&&Object(i.jsxs)(i.Fragment,{children:[Object(i.jsxs)("label",{className:"viewer-toolbar-settings-item",children:[Object(i.jsx)("input",{type:"checkbox",className:"sr-only checkbox-input",name:"invertColors",onChange:T,checked:r.invertColors}),Object(i.jsx)("div",{className:"checkbox",children:Object(i.jsx)("div",{className:"checkbox-tick"})}),Object(i.jsx)("span",{className:"checkbox-label",children:"Invert page colors."})]}),Object(i.jsxs)("label",{className:"viewer-toolbar-settings-item",children:[Object(i.jsx)("input",{type:"checkbox",className:"sr-only checkbox-input",name:"keepToolbarVisible",onChange:T,checked:r.keepToolbarVisible}),Object(i.jsx)("div",{className:"checkbox",children:Object(i.jsx)("div",{className:"checkbox-tick"})}),Object(i.jsx)("span",{className:"checkbox-label",children:"Keep toolbar visible."})]})]}),t.hideWarning&&Object(i.jsxs)("label",{className:"viewer-toolbar-settings-item",children:[Object(i.jsx)("input",{type:"checkbox",className:"sr-only checkbox-input",onChange:a,checked:t.saveLoadedFile}),Object(i.jsx)("div",{className:"checkbox",children:Object(i.jsx)("div",{className:"checkbox-tick"})}),Object(i.jsx)("span",{className:"checkbox-label",children:"Save loaded file."})]})]}),Object(i.jsxs)("button",{className:"btn icon-text-btn viewer-toolbar-dropdown-btn",onClick:function(){window.removeEventListener("scroll",g),window.removeEventListener("mousemove",k),c()},title:"Exit",children:[Object(i.jsx)(b.a,{name:"exit"}),Object(i.jsx)("span",{children:"Exit"})]})]})]})]})};n(87);var E=function({message:e,filePreferences:t,saveFileLoadModalFile:n,hideFileLoadModal:a,hideFileLoadMessage:s}){const[c,r]=Object(o.useState)(!1),l=Object(o.useRef)(0);function d(e){const i={...t,hideWarning:c,saveLoadedFile:e};var o;e?n(i):a(i),c&&(o=i,localStorage.setItem("file-preferences",JSON.stringify(o)))}return Object(o.useEffect)((()=>{if(clearTimeout(l.current),e.duration)return l.current=setTimeout((()=>{s()}),e.duration),()=>{clearTimeout(l.current)}}),[e]),"negative"===e.type?Object(i.jsx)(f.a,{notification:e,className:"viewer-file-load-modal viewer-notification",dismiss:s}):"warning"!==e.type||t.hideWarning?null:Object(i.jsxs)("div",{className:"viewer-file-load-modal viewer-file-load-warning",children:[Object(i.jsxs)("div",{className:"viewer-file-load-warning-mesasge-container",children:[Object(i.jsx)(b.a,{name:"info",size:"24px"}),Object(i.jsx)("p",{className:"viewer-file-load-warning-mesasge",children:e.value})]}),Object(i.jsxs)("label",{className:"checkbox-container viewer-file-load-warning-checkbox-container",children:[Object(i.jsx)("input",{type:"checkbox",className:"sr-only checkbox-input",onChange:function({target:e}){r(e.checked)},checked:c}),Object(i.jsx)("div",{className:"checkbox",children:Object(i.jsx)("div",{className:"checkbox-tick"})}),Object(i.jsx)("span",{className:"checkbox-label",children:"Don't show this message again."})]}),Object(i.jsxs)("div",{className:"viewer-file-load-warning-bottom",children:[Object(i.jsx)("button",{className:"btn text-btn",onClick:function(){d(!1)},children:"No"}),Object(i.jsx)("button",{className:"btn viewer-file-load-warning-btn",onClick:function(){d(!0)},children:"Yes"})]})]})};n(88);var L=function(){return Object(i.jsxs)("div",{className:"no-file-notice",children:[Object(i.jsx)(h.a,{}),Object(i.jsx)("p",{className:"no-file-notice-message",children:"File not found."}),Object(i.jsxs)(v.b,{to:"/",className:"btn icon-text-btn primary-btn",children:[Object(i.jsx)(b.a,{name:"bookshelf",size:"24px"}),Object(i.jsx)("span",{children:"Back to Files"})]})]})},k=n(141);class N{constructor(e,t,n){this.pdfDocument=e,this.pdfElement=t,this.url=n}navigateTo(e){this.goToDestination(e)}async goToDestination(e){let t=null;t="string"===typeof e?await this.pdfDocument.getDestination(e):e;const n=await this.pdfDocument.getPageIndex(t[0]);Object(s.k)(n+1,this.pdfElement.children,{keepToolbarVisible:Object(m.a)("keepToolbarVisible")})}getDestinationHash(e){if("string"===typeof e&&e.length)return this.getAnchorUrl(`#${escape(e)}`);if(Array.isArray(e)){const t=JSON.stringify(e);if(t.length)return this.getAnchorUrl(`#${escape(t)}`)}return this.getAnchorUrl("")}getAnchorUrl(e){return this.url+e}}let T=null,S=null,C=!1,M=!1;async function I(e,t){const n=await e(),i=document.getElementById("js-viewer-outline"),o=document.getElementById("js-viewer-outline-toggle-btn");S=t,i.firstElementChild&&(o.removeEventListener("click",F),i.firstElementChild.remove()),i.classList.remove("visible"),i.removeEventListener("click",A),o.classList.toggle("visible",n.length),n.length&&o.addEventListener("click",F),T=n,M=!1,C=!1}async function F(){const e=document.getElementById("js-viewer-outline");if(C=!C,!M){const t=document.createElement("div");t.classList.add("viewer-outline"),e.append(t),B(T,t),e.addEventListener("click",A),M=!0}e.classList.toggle("visible",C)}function A(e){if(e.target===e.currentTarget)return C=!1,void e.currentTarget.classList.remove("visible");const{nodeName:t}=e.target;if("A"===t)return S(e.target.href),void e.preventDefault();const n=e.target.closest(".btn");"BUTTON"===(null===n||void 0===n?void 0:n.nodeName)&&(n.classList.toggle("rotated"),n.parentElement.nextElementSibling.classList.toggle("visible"))}function B(e,t){const n=new DocumentFragment;for(const i of e){const e=document.createElement("div"),t=`<a href="${i.href}" class="viewer-outline-link">${i.title}</a>`;if(e.classList.add("viewer-outline-item"),i.items.length?e.insertAdjacentHTML("beforeend",`\n        <div class="viewer-outline-item-title">\n          <button class="btn icon-btn viewer-outline-tree-toggle-btn">\n            <svg viewBox="0 0 24 24">\n                <path d="M7,10L12,15L17,10H7Z"/>\n            </svg>\n          </button>\n          ${t}\n        </div>\n      `):e.insertAdjacentHTML("beforeend",t),i.items.length){const t=document.createElement("div");t.classList.add("viewer-outline-inner-tree"),B(i.items,t),e.append(t)}n.append(e)}t.append(n)}const z=Object(m.b)(),$=1.3333;let P=null,V=null,D=null,W=null,R=[],H=[],U=null,J=null,K=0,q=1,Y=!0,Z=!1,G=!1,X=!1,Q=!1;async function _(e,{metadata:t,blob:i,save:o=!0}){var a;P=await Promise.all([n.e(0),n.e(4),n.e(3)]).then(n.t.bind(null,68,7)),V=e,D=await Object(s.g)(i),W=t,(a=W).scale||(a.scale=Re()),J=W.scale,K=t.rotation||0,q=t.pageNumber||1,document.body.style.overscrollBehavior="none";const[r]=await Promise.all([Pe(D,t.rotation),"multi"===t.viewMode?We(V,D,t):Ve(V,D,t)]);H=r,function(e){const t=document.getElementById("js-viewer-zoom-out"),n=document.getElementById("js-viewer-zoom-in");Te(e),t.addEventListener("click",Ne),n.addEventListener("click",ke),document.getElementById("js-viewer-scale-select").addEventListener("change",Me)}(J),function(){const e=document.getElementById("js-viewer-previous-page"),t=document.getElementById("js-viewer-next-page"),n=document.getElementById("js-viewer-page-input-container"),i=document.getElementById("js-viewer-page-input");n.lastElementChild.textContent=`of ${W.pageCount}`,xe(q),ye(q),n.addEventListener("click",oe),e.addEventListener("click",Ee),t.addEventListener("click",Le),i.addEventListener("focus",ae),i.addEventListener("blur",se),i.addEventListener("keydown",ce)}(),I(be,ve),te(o);const[l,d]=document.getElementById("js-viewer-view-modes").children;"multi"===t.viewMode?(R=Ae(),l.classList.add("active"),window.addEventListener("scroll",ne),fe()):(ge(q),ee(),d.classList.add("active"),window.addEventListener("scroll",ie),window.addEventListener("click",re)),window.addEventListener("keydown",le),window.addEventListener("keyup",de),window.addEventListener("wheel",ue,{passive:!1}),document.getElementById("js-viewer-rotate-btn").addEventListener("click",Fe),document.getElementById("js-viewer-view-modes").addEventListener("click",Ie),window.scrollTo(t.scrollLeft,t.scrollTop),o&&("have read"!==t.status&&(1===t.pageCount?t.status="have read":t.status="reading"),t.accessedAt=Date.now(),Object(c.d)(t),u(i))}function ee(){const e=document.getElementById("js-viewer-nav-previous-btn"),t=document.getElementById("js-viewer-nav-next-btn");e.classList.add("visible"),t.classList.add("visible"),e.addEventListener("click",Ee),t.addEventListener("click",Le)}function te(e){Y=e}function ne(){X||(X=!0,requestAnimationFrame((()=>{const{scrollTop:e,scrollLeft:t}=document.documentElement,n=q;W.scrollTop=e<0?0:e,W.scrollLeft=t,q=function(e,t){for(let n=0;n<e.length-1;n+=1){const i=e[n],o=e[n+1],a=i.top+i.height/2,s=o.top+o.height/2;if(t>=a&&t<=s)return n+2}return 1}(R,W.scrollTop),W.pageNumber=q,Y&&(clearTimeout(Q),Q=setTimeout((()=>{Object(c.d)(W)}),1e3)),q!==n&&(xe(q),ye(q)),X=!1})))}function ie(){X||(X=!0,requestAnimationFrame((()=>{const{scrollTop:e,scrollLeft:t}=document.documentElement;W.scrollTop=e<0?0:e,W.scrollLeft=t,Y&&(clearTimeout(Q),Q=setTimeout((()=>{Object(c.d)(W)}),1e3)),X=!1})))}function oe(e){e.target!==e.currentTarget.firstElementChild&&e.currentTarget.firstElementChild.focus()}function ae({target:e}){const{pageCount:t}=W,n=t<1e3?3:t.toString().length;e.style.width=`${n}ch`,e.select()}function se({target:e}){const{pageNumber:t,pageCount:n}=W;let i=parseInt(e.value,10);if(Number.isNaN(i))return e.value=t,void(e.style.width=`${t.toString().length}ch`);i<1?i=1:i>n&&(i=n),e.style.width=`${i.toString().length}ch`,Oe(i,!1)}function ce(e){"Enter"===e.key&&e.target.blur()}function re({target:e}){"A"===e.nodeName&&e.classList.contains("internalLink")&&ve(e.href)}function le(e){if("INPUT"===e.target.nodeName)return;if(G=e.ctrlKey,e.ctrlKey)return"+"===e.key&&(ke(),e.preventDefault()),void("-"===e.key&&(Ne(),e.preventDefault()));const{scrollWidth:t,offsetWidth:n}=document.documentElement;t<=n&&("ArrowLeft"===e.key?Oe(q-1):"ArrowRight"===e.key&&Oe(q+1))}function de(e){G=e.ctrlKey}function ue(e){G&&(e.preventDefault(),e.wheelDelta>0?ke():Ne())}function me(e){const t=new N(D,V,window.location.href);return{title:e.title,href:t.getDestinationHash(e.dest),items:e.items.map(me)}}async function be(){const e=await D.getOutline();return e?e.map(me):[]}async function ve(e){const t=new URL(e);if(t.origin!==window.location.origin)return;const n=t.hash.split("#"),i=unescape(n[n.length-1]);let o="";try{o=JSON.parse(i)}catch{o=await D.getDestination(i)}Oe(await D.getPageIndex(o[0])+1)}function fe(){U&&U.disconnect();const e=R[q-1].height/2;U=new IntersectionObserver(pe,{rootMargin:`${e}px 0px`}),Array.from(V.children).forEach((e=>{U.observe(e)}))}function he(){U&&(U.disconnect(),U=null)}function pe(e){e.forEach((({isIntersecting:e,target:t})=>{!e||t.hasAttribute("data-loaded")&&!t.hasAttribute("data-rerender-needed")||(t.setAttribute("data-loaded","true"),we(t))}))}async function we(e){const t=parseInt(e.getAttribute("data-page-number"),10),{width:n,height:i}=Be(t-1,J.currentScale),o=document.createElement("canvas");let a=null,s=null;o.classList.add("viewer-page-canvas"),e.hasAttribute("data-rerender-needed")?([s,a]=e.children,a.innerHTML="",e.removeAttribute("data-rerender-needed")):(a=document.createElement("div"),a.classList.add("viewer-page-text"),e.appendChild(o),e.appendChild(a));const c=await D.getPage(t),r=c.getViewport({scale:J.currentScale,rotation:(K+c.rotate)%360});o.width=n,o.height=i,a.style.width=`${n}px`,a.style.height=`${i}px`,await c.render({canvasContext:o.getContext("2d"),enableWebGL:!0,viewport:r}).promise,requestAnimationFrame((async()=>{P.renderTextLayer({textContent:await c.getTextContent(),container:a,viewport:r,textDivs:[]}),async function(e,t,n){const i=await t.getAnnotations(),o=n.children[2];if(!i.length)return void(o&&o.remove());const a={page:t,annotations:i,viewport:e.clone({dontFlip:!0}),div:o,linkService:new N(D,V,window.location.href)};if(o&&"multi"===W.viewMode)P.AnnotationLayer.update(a);else{const e=document.createElement("div");e.className="viewer-annotation-layer",n.appendChild(e),a.div=e,P.AnnotationLayer.render(a),o&&o.remove()}}(r,c,e)})),s&&e.replaceChild(o,s)}function je(e){for(const[t,n]of Object.entries(V.children)){const{width:i,height:o}=Be(t,e);if(n.style.width=`${i}px`,n.style.height=`${o}px`,n.hasAttribute("data-loaded")){const e=n.firstElementChild,{width:t}=e;i===t?(e.style.width="",e.style.height="",n.removeAttribute("data-rerender-needed")):(e.style.width=`${i}px`,e.style.height=`${o}px`,n.setAttribute("data-rerender-needed",!0))}}}function ge(e){!function(e){const{width:t,height:n}=Be(e-1,J.currentScale),i=V.firstElementChild;if(i.style.width=`${t}px`,i.style.height=`${n}px`,i.setAttribute("data-page-number",e),i.hasAttribute("data-loaded")){const e=i.firstElementChild;e.style.width=`${t}px`,e.style.height=`${n}px`,i.setAttribute("data-rerender-needed",!0)}}(e),we(V.firstElementChild),V.firstElementChild.setAttribute("data-loaded","true")}function xe(e){const t=document.getElementById("js-viewer-page-input");t.value=e,t.style.width=`${e.toString().length}ch`}function ye(e){const t=document.getElementById("js-viewer-previous-page"),n=document.getElementById("js-viewer-next-page");1===e?t.disabled=!0:e===W.pageCount?n.disabled=!0:(t.disabled=!1,n.disabled=!1)}function Oe(e,t=!0){"multi"===W.viewMode?Object(s.k)(e,V.children,{keepToolbarVisible:z.keepToolbarVisible}):(q=e,W.pageNumber=q,ge(e),window.scrollTo(0,0),t&&xe(e),ye(e),Y&&Object(c.d)(W))}function Ee(){Oe(q-1)}function Le(){Oe(q+1)}function ke(){Se(Math.min(1.1*J.currentScale,13.333))}function Ne(){Se(Math.max(J.currentScale/1.1,.333325))}function Te(e){const t=document.getElementById("js-viewer-scale-select");t.value=e.name,t.firstElementChild.textContent=`${e.displayValue}%`}function Se(e,t="custom"){const n=J.currentScale;if(J.name=t,J.currentScale=e,J.displayValue=Math.round(100*e/$),W.scale=J,"multi"===W.viewMode){const{top:t}=Object(s.f)(q,V.children);je(e),R=Ae(),W.scrollTop=R[q-1].top-t/n*e,W.scrollLeft=W.scrollLeft/n*e,fe()}else ge(q),W.scrollTop=W.scrollTop/n*e,W.scrollLeft=W.scrollLeft/n*e;Te(J),window.scrollTo(W.scrollLeft,W.scrollTop),Y&&Object(c.d)(W)}function Ce(e){const t="single"===W.viewMode,{keepToolbarVisible:n}=z;return e-(n||1===q||t?56:16)}async function Me({target:e}){const{value:t}=e;let n=0;if("fit-width"===t){const{offsetWidth:e,scrollHeight:t,offsetHeight:i}=document.documentElement,{width:o,height:a}=await ze(D,{pageNumber:q,rotation:K}),c=Ce(i);let r=e-16,l=0;if(n=r/o,Math.round(n*o)>=r){const e=Math.round(n*a);t>i?"multi"===W.viewMode&&W.pageCount*e>i?l=0:e<c&&(l=Object(s.h)()):e>c&&(l=-Object(s.h)())}r+=l,n=r/o}else if("fit-page"===t){const{scrollWidth:e,offsetWidth:t,offsetHeight:i}=document.documentElement,{width:o,height:a}=await ze(D,{pageNumber:q,rotation:K}),c=t-16;let r=Ce(i),l=0;if(n=r/a,Math.round(n*a)>=r){const i=Math.round(n*o);e>t?i<c&&(l=Object(s.h)()):i>c&&(l=-Object(s.h)())}r+=l,n=r/a}else n=$*t;Se(n,t)}async function Ie(e){const t=Object(s.c)("data-mode",e.target,e.currentTarget);if(!t)return;const{attrValue:n}=t;if(n===W.viewMode)return;const[i,o]=e.currentTarget.children;i.classList.toggle("active"),o.classList.toggle("active"),W.viewMode=n,V.innerHTML="","multi"===n?(await We(V,D,W),R=Ae(),Object(s.k)(q,V.children,{keepToolbarVisible:z.keepToolbarVisible,scrollLeft:0}),fe(),function(){const e=document.getElementById("js-viewer-nav-previous-btn"),t=document.getElementById("js-viewer-nav-next-btn");e.classList.remove("visible"),t.classList.remove("visible"),e.removeEventListener("click",Ee),t.removeEventListener("click",Le)}(),window.addEventListener("scroll",ne),window.removeEventListener("scroll",ie),window.removeEventListener("click",re)):(he(),await Ve(V,D,W),ge(q),window.scrollTo(0,0),ee(),window.addEventListener("scroll",ie),window.addEventListener("click",re),window.removeEventListener("scroll",ne)),Y&&Object(c.d)(W)}function Fe(){const e=K+90;K=360===e?0:e,W.rotation=K,Z=!Z,"multi"===W.viewMode?(je(J.currentScale),R=Ae(),fe(),Object(s.k)(q,V.children,{keepToolbarVisible:z.keepToolbarVisible})):(ge(q),window.scrollTo(0,0)),Y&&Object(c.d)(W)}function Ae(){return Array.from(V.children).map((e=>({top:e.offsetTop,left:e.offsetLeft,width:e.offsetWidth,height:e.offsetHeight})))}function Be(e,t){const n=H[e];let i=Math.floor(n.width*t),o=Math.floor(n.height*t);return Z&&([i,o]=[o,i]),{width:i,height:o}}async function ze(e,{pageNumber:t,scale:n={currentScale:1},rotation:i=0}){const o=await e.getPage(t);return o.getViewport({scale:n.currentScale,rotation:i+o.rotate})}async function $e(e,t){const{width:n,height:i}=await ze(e,t),o=document.createElement("div");return o.style.width=`${Math.floor(n)}px`,o.style.height=`${Math.floor(i)}px`,o.setAttribute("data-page-number",t.pageNumber),o.classList.add("viewer-page"),o}async function Pe(e,t){const n=[];for(let i=0;i<e.numPages;i+=1){const{width:o,height:a}=await ze(e,{pageNumber:i+1,rotation:t});n.push({width:o,height:a})}return n}async function Ve(e,t,n){const i=await $e(t,n);e.appendChild(i)}async function De(e,t,n,i){const o=await $e(i,{...t,pageNumber:e});n.appendChild(o)}async function We(e,t,n){const i=new DocumentFragment,o=[];for(let a=0;a<t.numPages;a+=1)o.push(De(a+1,n,i,t));await Promise.all(o),e.appendChild(i)}function Re(){return{name:"1",currentScale:$}}let He=null,Ue=null,Je=null,Ke=null,qe=null,Ye=0,Ze=!0,Ge="",Xe=null,Qe="";async function _e(e,{metadata:t,blob:i,save:o=!0}){const{default:a}=await Promise.all([n.e(0),n.e(1)]).then(n.bind(null,138));He=a(i),Je=t,Ke=t.scale||{name:"1",currentScale:1},qe=e,Ue=gt(t.viewMode),document.getElementById("js-viewer-themes").addEventListener("click",tt),function(e){const t=document.getElementById("js-viewer-zoom-out"),n=document.getElementById("js-viewer-zoom-in");vt(e),t.addEventListener("click",ht),n.addEventListener("click",ft),document.getElementById("js-viewer-scale-select").addEventListener("change",pt)}(Ke),function(e,t){const n=document.getElementById("js-viewer-previous-page"),i=document.getElementById("js-viewer-next-page"),o=document.getElementById("js-viewer-page-input-container"),a=document.getElementById("js-viewer-page-input");rt(e),function(){const e=document.getElementById("js-viewer-nav-previous-btn"),t=document.getElementById("js-viewer-nav-next-btn");e.classList.add("visible"),t.classList.add("visible"),e.addEventListener("click",mt),t.addEventListener("click",bt)}(),o.lastElementChild.textContent=`of ${t}`,o.addEventListener("click",xt),n.addEventListener("click",mt),i.addEventListener("click",bt),a.addEventListener("focus",yt),a.addEventListener("blur",Ot),a.addEventListener("keydown",Et)}(t.pageNumber,t.pageCount),function(e){const[t,n]=document.getElementById("js-viewer-view-modes").children;"single"===e?t.classList.add("active"):n.classList.add("active");document.getElementById("js-viewer-view-modes").addEventListener("click",jt)}(t.viewMode),I(ut,lt),await He.ready,t.storedPosition?await He.locations.load(t.storedPosition):(await He.locations.generate(1650),t.storedPosition=He.locations.save(),t.pageCount=He.locations.length()),t.pageNumber=t.location?He.locations.locationFromCfi(t.location)+1:1,Ue.on("relocated",ot),Ue.on("keydown",at),Ue.on("click",st),Ue.display(t.location),ct(o),window.addEventListener("keydown",Lt),window.addEventListener("dropdown-visible",et),o&&("have read"!==t.status&&(1===t.pageCount?t.status="have read":t.status="reading"),t.accessedAt=Date.now(),Object(c.d)(t),u(i))}function et({detail:e}){Ge=e.id,Xe=e.hide}function tt(e){const t=Object(s.c)("data-theme",e.target,e.currentTarget);t&&(Je.theme=t.attrValue,it(),Ze&&(clearTimeout(Ye),Ye=setTimeout((()=>{Object(c.d)(Je)}),1e3)))}function nt(e){for(const n of e.document.styleSheets)for(const e of n.rules){var t;if((null===(t=e.style)||void 0===t?void 0:t.fontSize)&&"html"!==e.selectorText)if(e.style.fontSize.endsWith("pt")){const t=Math.round(1.3333*Number.parseFloat(e.style.fontSize))/16;e.style.fontSize=`${t}rem`}else if(e.style.fontSize.endsWith("px")){const t=Number.parseFloat(e.style.fontSize)/16;e.style.fontSize=`${t}rem`}else if(e.style.fontSize.endsWith("%")){const t=Number.parseFloat(e.style.fontSize)/100;e.style.fontSize=`${t}rem`}else if(e.style.fontSize.endsWith("em"))e.style.fontSize=`${Number.parseFloat(e.style.fontSize)}rem`;else{const t={"xx-small":"0.5625","x-small":"0.625",small:"0.8333",medium:"1",large:"1.125","x-large":"1.5","xx-large":"2","xxx-large":"3"};t[e.style.fontSize]&&(e.style.fontSize=`${t[e.style.fontSize]}rem`)}}}function it(){const{theme:e}=Je;if(!e)return;const t={black:{body:{color:"white","background-color":"black"}},white:{body:{color:"black","background-color":"white"}},grey:{body:{color:"white","background-color":"#1d1c1b"}},orange:{body:{color:"black","background-color":"#FBF0D9"}}};Ue.getContents().forEach((e=>e.addStylesheetRules(t[Je.theme]))),Qe&&qe.firstElementChild.classList.remove(`theme-${Qe}`),qe.firstElementChild.classList.add(`theme-${Je.theme}`),Qe=Je.theme}function ot(e){const{cfi:t,location:n,index:i}=e.start,o=n+1;Je.location=t,Je.pageNumber=He.locations.locationFromCfi(t)+1,rt(o),function(e,t,{location:n,index:i,atStart:o}){const a=document.getElementById("js-viewer-previous-page"),s=document.getElementById("js-viewer-next-page");o||0===n&&0===i?a.disabled=!0:e===t||"spread"===Je.viewMode&&n+2===t?s.disabled=!0:(a.disabled=!1,s.disabled=!1)}(o,He.locations.length(),{location:n,index:i,atStart:e.atStart}),Ze&&(clearTimeout(Ye),Ye=setTimeout((()=>{Object(c.d)(Je)}),1e3))}function at(e){e.ctrlKey&&document.activeElement.blur()}function st(){Ge&&(Ge="",Xe())}function ct(e){Ze=e}function rt(e){const t=document.getElementById("js-viewer-page-input");t.value=e,t.style.width=`${e.toString().length}ch`}function lt(e){Ue.display(e.split(/viewer\/.*?\//g)[1])}function dt(e){return{title:e.label,href:`${window.location.href}/${e.href}`,items:e.subitems.map(dt)}}async function ut(){const e=await He.loaded.navigation;return Array.isArray(e.toc)?e.toc.map(dt):[]}function mt(){Ue.prev()}function bt(){Ue.next()}function vt(e){const t=document.getElementById("js-viewer-scale-select");t.value=e.name,t.firstElementChild.textContent=`${e.displayValue}%`}function ft(){wt(Math.min(1.1*Ke.currentScale,13.333))}function ht(){wt(Math.max(Ke.currentScale/1.1,.333325))}async function pt({target:e}){const{value:t}=e;wt(t,t)}function wt(e,t="custom"){Ke.name=t,Ke.currentScale=e,Ke.displayValue=Math.round(100*e),Je.scale=Ke,vt(Ke),Ue.themes.default({html:{"font-size":100*e+"% !important"}}),Ze&&Object(c.d)(Je)}function jt(e){const t=Object(s.c)("data-mode",e.target,e.currentTarget);if(!t)return;const{attrValue:n}=t;if(n===Je.viewMode)return;const[i,o]=e.currentTarget.children;i.classList.toggle("active"),o.classList.toggle("active"),Je.viewMode=n,qe.innerHTML="",Ue.off("relocated",ot),Ue=gt(n),Ue.on("relocated",ot),Ue.on("keydown",at),Ue.on("click",st),Ue.display(Je.location),Ze&&Object(c.d)(Je)}function gt(e){const t={flow:"paginated",height:document.documentElement.offsetHeight-40};"single"===e&&(t.spread="none");const n=He.renderTo(qe,t);return n.hooks.content.register(nt),n.hooks.content.register(it),n.themes.default({html:{"font-size":100*Ke.currentScale+"% !important"},"::selection":{"background-color":"hsla(260, 48%, 52%, 0.4)"}}),n}function xt(e){e.target!==e.currentTarget.firstElementChild&&e.currentTarget.firstElementChild.focus()}function yt({target:e}){const{pageCount:t}=Je,n=t<1e3?3:t.toString().length;e.style.width=`${n}ch`,e.select()}function Ot({target:e}){const{location:t,pageCount:n}=Je,i=He.locations.locationFromCfi(t);let o=parseInt(e.value,10);if(Number.isNaN(o))return e.value=i,void(e.style.width=`${i.toString().length}ch`);o<1?o=1:o>n&&(o=n);const a=He.locations.cfiFromLocation(o);e.style.width=`${o.toString().length}ch`,Ue.display(a)}function Et(e){"Enter"===e.key&&e.target.blur()}function Lt(e){if("INPUT"!==e.target.nodeName)return e.ctrlKey?("+"===e.key&&(ft(),e.preventDefault()),void("-"===e.key&&(ht(),e.preventDefault()))):void("ArrowLeft"===e.key?mt():"ArrowRight"===e.key&&bt())}n(89);t.default=function(){var e;const t=Object(a.f)(),{id:r}=Object(a.g)(),[l,v]=Object(o.useState)({}),[f,h]=Object(o.useState)((()=>JSON.parse(localStorage.getItem("file-preferences"))||{})),[p,w]=Object(o.useState)((()=>Object(m.b)())),[x,y]=Object(o.useState)(null),N=Object(o.useRef)(null),T=Object(o.useRef)(!1),S=Object(o.useCallback)((function(e){if(e.preventDefault(),e.dataTransfer.files.length){const[t]=e.dataTransfer.files;A(t)}}),[l,f,x]);function C(e){e.preventDefault()}function M(e){const[t]=e.target.files;A(t),e.target.value=""}function I(e,t){var n;T.current=!0,(n=t.metadata).type||(n.type="pdf"),"pdf"===t.metadata.type?_(e,t):"epub"===t.metadata.type&&_e(e,t)}function F(){l.file&&("pdf"===l.file.type?(he(),V&&(V.innerHTML=""),D=null,document.body.style.overscrollBehavior="",window.removeEventListener("scroll",ne),window.removeEventListener("scroll",ie),window.removeEventListener("keydown",le),window.removeEventListener("keyup",de),window.removeEventListener("wheel",ue,{passive:!1})):"epub"===l.file.type&&(qe&&(qe.innerHTML=""),window.removeEventListener("keydown",Lt),window.removeEventListener("dropdown-visible",et)))}async function A(e){l.file&&(["pdf","epub"].includes(l.file.type)?e.name===l.file.name?l.filePreviewVisible?(I(N.current,{blob:e,metadata:l.file,save:!0}),z(),v({file:l.file})):y({type:"negative",value:"File is already loaded.",duration:4e3}):l.filePreviewVisible?y({file:e,type:"warning",value:"File does not match currently loaded file.\nDo you want to load it anyway?"}):B({file:e}):y({type:"negative",value:"File format is not supported.",duration:4e3}))}async function B({file:e}){v({...l,loading:!0});let i=await async function(e){return(await Object(c.c)()).find((({name:t})=>t===e.name))}(e),o=!0;if(!i){const t=e.name.slice(e.name.lastIndexOf(".")+1);"pdf"===t?i=await async function(e){D=await Object(s.g)(e);const[t,n]=await Promise.all([D.getMetadata(),Object(s.i)(D)]);return{...Object(s.j)(t),id:Object(k.a)(),name:e.name,type:"pdf",createdAt:Date.now(),scale:Re(),size:e.size,sizeString:Object(s.e)(e.size),pageNumber:1,pageCount:D.numPages,viewMode:"multi",coverImage:n}}(e):"epub"===t&&(i=await async function(e){const{default:t}=await Promise.all([n.e(0),n.e(1)]).then(n.bind(null,138));He=t(e),await He.ready;const[i,o,a]=await Promise.all([He.loaded.metadata,He.locations.generate(1650),Object(s.d)(He)]),c={storedPosition:JSON.stringify(o),coverImage:a,id:Object(k.a)(),name:e.name,type:"epub",createdAt:Date.now(),scale:{name:"1",currentScale:1},size:e.size,sizeString:Object(s.e)(e.size),pageNumber:1,pageCount:He.locations.length(),viewMode:"single"};return i.title&&(c.title=i.title),i.creator&&(c.author=i.creator),c}(e)),l.filePreviewVisible||(f.hideWarning?o=f.saveLoadedFile:(o=!1,y({file:e,type:"warning",value:"Do you want to save this file?"})))}!function(e,t){T.current&&F(),I(e,t)}(N.current,{metadata:i,blob:e,save:o}),t.replace({pathname:`/viewer/${i.id}`,state:!0}),Object(s.l)(i.name),v({file:i})}function z(){y(null)}function $(e){var t;t=e.saveLoadedFile,"pdf"===l.file.type?te(t):"epub"===l.file.type&&ct(t),h(e),z()}return Object(o.useLayoutEffect)((()=>F()),[]),Object(o.useLayoutEffect)((()=>{!async function(){if(t.location.state)return;const e=await Object(c.b)(r);if(e){const t=await d();e.type||(e.type="pdf"),t&&t.name===e.name?(I(N.current,{blob:t,metadata:e}),v({file:e})):v({file:e,filePreviewVisible:!0}),Object(s.l)(e.name)}else v({error:!0}),Object(s.l)("Error")}()}),[r]),Object(o.useEffect)((()=>(window.addEventListener("drop",S),window.addEventListener("dragover",C),()=>{window.removeEventListener("drop",S),window.removeEventListener("dragover",C)})),[S]),Object(o.useEffect)((()=>{if(l.file){if("single"===l.file.viewMode&&"pdf"===l.file.type){if(matchMedia("only screen and (hover: none) and (pointer: coarse)").matches&&!p.keepToolbarVisible)return void N.current.classList.remove("offset")}N.current.classList.add("offset")}}),[p.keepToolbarVisible,l.file]),l.error?Object(i.jsx)(L,{}):Object(i.jsxs)(i.Fragment,{children:[l.filePreviewVisible?Object(i.jsx)(g,{file:l.file,loading:l.loading,notification:x,dismissNotification:z,handleFileUpload:M,loadPreviewFile:function(){B(x),z()}}):x?Object(i.jsx)(E,{message:x,filePreferences:f,saveFileLoadModalFile:function(e){var t,n;t=x.file,n=l.file,Object(c.d)(n),u(t),$(e)},hideFileLoadModal:$,hideFileLoadMessage:z}):null,l.file&&!l.filePreviewVisible&&Object(i.jsxs)(i.Fragment,{children:[Object(i.jsx)(O,{file:l.file,filePreferences:f,setViewerSettings:function(e,t){w({...p,[e]:t})},updateFileSavePreference:function({target:e}){const t={...f,saveLoadedFile:e.checked};var n;h(t),n=t,localStorage.setItem("file-preferences",JSON.stringify(n))},handleFileUpload:M,exitViewer:function(){t.push({pathname:"/"}),F()}}),l.loading&&Object(i.jsx)(j,{})]}),Object(i.jsx)("div",{className:"viewer offset"+("pdf"===(null===(e=l.file)||void 0===e?void 0:e.type)&&p.invertColors?" invert":""),ref:N}),Object(i.jsx)("div",{id:"js-viewer-outline",className:"viewer-outline-container"}),Object(i.jsx)("button",{id:"js-viewer-nav-previous-btn",className:"btn icon-btn viewer-navigation-btn previous",children:Object(i.jsx)(b.a,{name:"chevron-left"})}),Object(i.jsx)("button",{id:"js-viewer-nav-next-btn",className:"btn icon-btn viewer-navigation-btn next",children:Object(i.jsx)(b.a,{name:"chevron-right"})})]})}},83:function(e,t,n){},84:function(e,t,n){},85:function(e,t,n){},86:function(e,t,n){},87:function(e,t,n){},88:function(e,t,n){},89:function(e,t,n){}}]);