(this["webpackJsonpmodest-read"]=this["webpackJsonpmodest-read"]||[]).push([[6],{138:function(e,t,n){"use strict";var s,i=new Uint8Array(16);function c(){if(!s&&!(s="undefined"!==typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||"undefined"!==typeof msCrypto&&"function"===typeof msCrypto.getRandomValues&&msCrypto.getRandomValues.bind(msCrypto)))throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return s(i)}var a=/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;for(var o=function(e){return"string"===typeof e&&a.test(e)},r=[],l=0;l<256;++l)r.push((l+256).toString(16).substr(1));var d=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,n=(r[e[t+0]]+r[e[t+1]]+r[e[t+2]]+r[e[t+3]]+"-"+r[e[t+4]]+r[e[t+5]]+"-"+r[e[t+6]]+r[e[t+7]]+"-"+r[e[t+8]]+r[e[t+9]]+"-"+r[e[t+10]]+r[e[t+11]]+r[e[t+12]]+r[e[t+13]]+r[e[t+14]]+r[e[t+15]]).toLowerCase();if(!o(n))throw TypeError("Stringified UUID is invalid");return n};t.a=function(e,t,n){var s=(e=e||{}).random||(e.rng||c)();if(s[6]=15&s[6]|64,s[8]=63&s[8]|128,t){n=n||0;for(var i=0;i<16;++i)t[n+i]=s[i];return t}return d(s)}},141:function(e,t,n){"use strict";n.r(t);var s=n(3),i=n(0),c=n(138),a=(n(76),n(34)),o=n(40),r=n(38),l=n(32),d=n(43),u=n.p+"static/media/background-image.b12894ed.png",b=n.p+"static/media/icon.4d9a1499.svg";n(77);var f=function({hide:e}){return Object(s.jsx)("div",{className:"landing-container",children:Object(s.jsxs)("div",{className:"landing",children:[Object(s.jsx)("div",{className:"landing-background"}),Object(s.jsx)("div",{className:"landing-background-image-container",children:Object(s.jsx)("img",{src:u,className:"landing-background-image",alt:""})}),Object(s.jsxs)("div",{className:"landing-main",children:[Object(s.jsx)("img",{src:b,alt:"",className:"landing-icon"}),Object(s.jsx)("h1",{className:"landing-title",children:"ModestRead"}),Object(s.jsx)("p",{className:"landing-subtitle",children:"A simple way to enjoy reading."}),Object(s.jsx)("button",{className:"btn primary-btn landing-btn",onClick:e,children:"Get Started"})]})]})})},j=n(44),m=n(39);n(78);var h=function({notification:e,dismiss:t,handleFileUpload:n}){return Object(s.jsxs)("div",{className:"no-files-notice",children:[Object(s.jsx)(m.a,{}),Object(s.jsxs)("div",{className:"no-files-notice-message-container",children:[Object(s.jsx)("p",{className:"no-files-notice-message-main",children:"You don't have any files."}),Object(s.jsx)("p",{className:"no-files-notice-message",children:"Drag and drop or click on a button to import."})]}),e&&Object(s.jsx)(j.a,{notification:e,margin:"bottom",dismiss:t}),Object(s.jsxs)("label",{className:"btn icon-text-btn primary-btn no-files-notice-btn",children:[Object(s.jsx)(l.a,{name:"upload",size:"24px"}),Object(s.jsx)("span",{children:"Import Files"}),Object(s.jsx)("input",{type:"file",onChange:n,className:"sr-only",accept:"application/pdf",multiple:!0})]})]})},g=n(63);n(79);var p=function(){return Object(s.jsxs)("li",{className:"file-card-placeholder",children:[Object(s.jsx)("div",{className:"file-card-image-placeholder"}),Object(s.jsxs)("div",{className:"file-card-info-placeholder",children:[Object(s.jsx)("div",{className:"file-card-title-placeholder"}),Object(s.jsx)("div",{className:"file-card-author-placeholder"}),Object(s.jsxs)("div",{className:"file-card-secondary-info-placeholder",children:[Object(s.jsx)("div",{className:"file-card-secondary-info-item-placeholder"}),Object(s.jsx)("div",{className:"file-card-secondary-info-item-placeholder"})]}),Object(s.jsx)("div",{className:"file-card-progress-placeholder"}),Object(s.jsx)("div",{className:"file-card-bottom-placeholder",children:Object(s.jsx)("div",{className:"file-card-bottom-btn-placeholder"})})]})]})};n(80);var O=function({searchFiles:e,resetSearch:t}){const[n,c]=Object(i.useState)(""),a=Object(i.useRef)(0);return Object(s.jsxs)("div",{className:"files-search",children:[Object(s.jsx)(l.a,{name:"search",className:"files-search-item files-search-icon"}),Object(s.jsx)("input",{type:"text",className:"input files-search-input",placeholder:"Search",onChange:function({target:t}){c(t.value),clearTimeout(a.current),a.current=setTimeout((()=>{e(t.value)}),400)},value:n}),n&&Object(s.jsx)("button",{className:"btn icon-btn icon-btn-alt files-search-item files-search-btn",onClick:function(){t(),c("")},children:Object(s.jsx)(l.a,{name:"close"})})]})};n(81);var x=function({sortBy:e,sortOrder:t,sortFileCatalog:n}){function i({target:t}){n(e,Number(t.value))}return Object(s.jsxs)(d.a,{toggle:{content:Object(s.jsxs)(s.Fragment,{children:[Object(s.jsx)(l.a,{name:"sort",size:"24px"}),Object(s.jsx)("span",{children:"Sort"})]}),className:"btn icon-text-btn files-sort-dropdown-toggle-btn"},body:{className:"files-sort-dropdown"},children:[Object(s.jsxs)("div",{className:"files-sort-dropdown-group",children:[Object(s.jsx)("button",{className:"btn text-btn dropdown-btn files-sort-dropdown-btn"+("file-name"===e?" active":""),onClick:()=>n("file-name"),children:"File name"}),Object(s.jsx)("button",{className:"btn text-btn dropdown-btn files-sort-dropdown-btn"+("file-size"===e?" active":""),onClick:()=>n("file-size"),children:"File size"}),Object(s.jsx)("button",{className:"btn text-btn dropdown-btn files-sort-dropdown-btn"+("last-accessed"===e?" active":""),onClick:()=>n("last-accessed"),children:"Last accessed"})]}),Object(s.jsxs)("div",{className:"files-sort-dropdown-group",children:[Object(s.jsxs)("label",{className:"dropdown-btn files-sort-dropdown-radio",children:[Object(s.jsx)("input",{type:"radio",className:"sr-only radio-input",name:"sortOrder",value:"1",onChange:i,checked:1===t}),Object(s.jsx)("div",{className:"radio"}),Object(s.jsx)("span",{className:"radio-label",children:"Ascending"})]}),Object(s.jsxs)("label",{className:"dropdown-btn files-sort-dropdown-radio",children:[Object(s.jsx)("input",{type:"radio",className:"sr-only radio-input",onChange:i,name:"sortOrder",value:"-1",checked:-1===t}),Object(s.jsx)("div",{className:"radio"}),Object(s.jsx)("span",{className:"radio-label",children:"Descending"})]})]})]})};n(82);var v=function({type:e,iconId:t,title:n,message:c,action:a,hide:o,resetProgress:r,removeFile:d}){const u="reset"===e?r:d;function b(e){"Escape"===e.key&&o()}return Object(i.useEffect)((()=>(window.addEventListener("keydown",b),()=>{window.removeEventListener("keydown",b)})),[]),Object(s.jsx)("div",{className:"files-modal",onClick:function(e){e.target===e.currentTarget&&o()},children:Object(s.jsxs)("div",{className:"files-modal-content",children:[Object(s.jsxs)("div",{className:"files-modal-title-container",children:[Object(s.jsx)(l.a,{name:t,className:"files-modal-title-icon"}),Object(s.jsx)("h3",{className:"files-modal-title",children:n})]}),Object(s.jsx)("p",{children:c}),Object(s.jsxs)("div",{className:"files-modal-content-bottom",children:[Object(s.jsx)("button",{className:"btn text-btn",onClick:o,children:"Cancel"}),Object(s.jsxs)("button",{className:"btn icon-text-btn",onClick:u,children:[Object(s.jsx)(l.a,{name:t}),Object(s.jsx)("span",{children:a})]})]})]})})};t.default=function(){const[e,t]=Object(i.useState)(null),[u,b]=Object(i.useState)([]),[m,C]=Object(i.useState)(null),[w,N]=Object(i.useState)(null),[y,L]=Object(i.useState)(!1),[H,V]=Object(i.useState)((()=>localStorage.getItem("hide-landing-page"))),[M,k]=Object(i.useState)(null),A=Object(i.useCallback)((function(e){e.preventDefault(),e.dataTransfer.files.length&&Z(e.dataTransfer.files)}),[e,u]),S=Object(i.useCallback)((function(e){e.preventDefault()}),[e,u]);function Z(n){const s=Array.from(n).filter((e=>e.name.endsWith(".pdf")||e.name.endsWith(".epub")));if(1===n.length){let e="";if(s.length?u.find((({name:e})=>e===n[0].name))&&(e="File already exist."):e="File is not supported.",e)return C({value:e}),void N(!1)}else if(!s.length)return C({value:"No supported files found."}),void N(!1);const i=[],r=[];for(const e of s){u.find((({name:t})=>t===e.name))?i.push(e.name):r.push({blob:e,id:Object(c.a)(),createdAt:Date.now(),name:e.name,size:e.size,type:e.name.slice(e.name.lastIndexOf(".")+1),sizeString:Object(a.e)(e.size),status:"not started",pageNumber:1,loading:!0})}if(i.length){if(i.length===n.length)return C({value:"Files already exist."}),void N(!1);C({value:"Some of the files were not imported because they already exist.",files:i,expandable:!0})}const l=Object(o.e)(r.concat(u),{sortBy:e.sortBy,sortOrder:e.sortOrder});b(l),L(!0),t({...e,categories:z(l)}),N(!1),m&&B(),localStorage.setItem("hide-landing-page",!0)}function z(e){const t=[{name:"All",id:"all",icon:"bookshelf",files:[]},{name:"Reading",id:"reading",icon:"open-book",files:[]},{name:"Planing to Read",id:"planing to read",icon:"book-question-mark",files:[]},{name:"Have Read",id:"have read",icon:"book-check-mark",files:[]},{name:"Not Started",id:"not started",icon:"book",files:[]}];for(const n of t)"all"===n.id?n.files=e:n.files=e.filter((e=>e.status===n.id));return t}function E(e){e.target.files.length&&Z(e.target.files),e.target.value=""}function R(){k(null)}function B(){C(null)}function I(n){n!==e.type&&(t({...e,type:n}),Object(r.c)("layoutType",n))}function F(n){const{checked:s}=n.target;t({...e,showCategories:s}),Object(r.c)("showCategories",s)}function T(){N(!w)}function $({target:e,currentTarget:t}){w&&e===t&&N(!1)}function D(){delete e.matchedFileCount,delete e.searchCategories,t({...e})}function P(n){return Object(s.jsx)(g.a,{file:n,showLink:!0,children:Object(s.jsxs)(d.a,{toggle:{content:Object(s.jsx)(l.a,{name:"dots-vertical"}),title:"More",className:"btn icon-btn"},children:[Object(s.jsxs)("div",{className:"files-file-card-dropdown-group",children:[Object(s.jsx)("div",{className:"files-file-card-dropdown-group-title",children:"Reading Status"}),e.categories.slice(1).map(((i,c)=>Object(s.jsxs)("button",{className:"btn icon-text-btn dropdown-btn files-file-card-dropdown-btn"+(n.status===i.id?" active":""),onClick:()=>function(n,s){const i=u.findIndex((e=>e.id===n)),c=u[i];s!==c.status&&("reset"===s?delete c.status:(c.status=s,"reading"===s&&(c.accessedAt=Date.now(),u.splice(i,1),u.unshift(c))),b([...u]),t({...e,categories:z(u)}),Object(o.d)(c))}(n.id,i.id),children:[Object(s.jsx)(l.a,{name:i.icon}),Object(s.jsx)("span",{children:i.name})]},c)))]}),Object(s.jsxs)("div",{className:"files-file-card-dropdown-group",children:[Object(s.jsxs)("button",{className:"btn icon-text-btn dropdown-btn files-file-card-dropdown-btn",onClick:()=>{return e=n.id,void k({id:e,type:"reset",iconId:"reset",title:"Reset Progress?",message:"Are you sure you want to reset reading progress for this file?",action:"Reset"});var e},children:[Object(s.jsx)(l.a,{name:"reset"}),Object(s.jsx)("span",{children:"Reset Progress"})]}),Object(s.jsxs)("button",{className:"btn icon-text-btn dropdown-btn files-file-card-dropdown-btn",onClick:()=>{return e=n.id,void k({id:e,type:"remove",iconId:"trash",title:"Remove File?",message:"Are you sure you want to remove this file?",action:"Remove"});var e},children:[Object(s.jsx)(l.a,{name:"trash"}),Object(s.jsx)("span",{children:"Remove File"})]})]})]})},n.id)}function U(t){return Object(s.jsx)("ul",{className:`files-cards ${e.type}`,children:t.map((e=>e.loading?Object(s.jsx)(p,{},e.id):P(e)))})}return Object(i.useEffect)((()=>{H?async function(){const e=Object(r.b)(),n=await Object(o.c)(e);b(n),t({visibleCategory:"all",categories:z(n),sortBy:e.sortBy,sortOrder:e.sortOrder,type:e.layoutType,showCategories:e.showCategories}),Object(a.l)("Files")}():window.title="ModestRead"}),[H]),Object(i.useEffect)((()=>{async function e(e){"pdf"===e.type?async function(e){const t=await Object(a.g)(e.blob),[n,s]=await Promise.all([t.getMetadata(),Object(a.i)(t)]);delete e.loading,delete e.blob,Object.assign(e,{...Object(a.j)(n),coverImage:s,viewMode:"multi",pageCount:t.numPages}),b([...u]),Object(o.d)(e)}(e):"epub"===e.type&&async function(e){const{default:t}=await Promise.all([n.e(0),n.e(1)]).then(n.bind(null,139)),s=t(e.blob);await s.ready;const[i,c,r]=await Promise.all([s.loaded.metadata,s.locations.generate(1650),Object(a.d)(s)]);i.title&&(e.title=i.title),i.creator&&(e.author=i.creator),e.storedPosition=JSON.stringify(c),e.pageCount=s.locations.length(),e.coverImage=r,e.viewMode="single",delete e.loading,delete e.blob,b([...u]),Object(o.d)(e)}(e)}y&&(L(!1),async function(){for(const t of u)t.loading&&e(t)}())}),[y]),Object(i.useEffect)((()=>(window.addEventListener("drop",A),window.addEventListener("dragover",S),()=>{window.removeEventListener("drop",A),window.removeEventListener("dragover",S)})),[A,S]),H?e?Object(s.jsxs)("div",{className:"files",children:[u.length?Object(s.jsxs)(s.Fragment,{children:[Object(s.jsxs)("div",{className:"files-header",children:[Object(s.jsx)("div",{className:"files-sidebar-toggle-btn-container",children:Object(s.jsx)("button",{className:"btn icon-btn",onClick:T,children:Object(s.jsx)(l.a,{name:"menu",size:"24px"})})}),Object(s.jsx)("div",{className:"files-header-title-container",children:Object(s.jsx)("h1",{className:"files-header-title",children:"ModestRead"})}),Object(s.jsx)("div",{className:"files-categories-container"+(w?" visible":""),onClick:$,children:Object(s.jsxs)("div",{className:"files-sidebar",children:[Object(s.jsx)("div",{className:"files-sidebar-title-container",children:Object(s.jsx)("span",{className:"files-sidebar-title",children:"ModestRead"})}),Object(s.jsx)("ul",{className:"files-categories",children:e.categories.map(((n,i)=>Object(s.jsx)("li",{children:Object(s.jsxs)("button",{className:"btn icon-text-btn files-category-btn"+(e.visibleCategory===n.id?" active":""),onClick:()=>function(n){n!==e.visibleCategory&&(t({...e,visibleCategory:n}),w&&N(!1))}(n.id),children:[Object(s.jsx)(l.a,{name:n.icon,size:"24px"}),Object(s.jsx)("span",{children:n.name}),Object(s.jsx)("span",{children:n.files.length})]})},i)))}),Object(s.jsxs)("label",{className:"btn icon-text-btn dropdown-btn files-import-btn",children:[Object(s.jsx)(l.a,{name:"upload",size:"24px"}),Object(s.jsx)("span",{children:"Import Files"}),Object(s.jsx)("input",{type:"file",onChange:E,className:"sr-only",accept:"application/pdf",multiple:!0})]}),Object(s.jsxs)(d.a,{toggle:{content:Object(s.jsx)(l.a,{name:"settings",size:"24px"}),title:"Settings",className:"btn icon-btn icon-btn-alt files-settings-toggle-btn"},body:{className:"files-settings"},children:[Object(s.jsxs)("div",{className:"files-settings-layout",children:[Object(s.jsxs)("button",{className:"btn icon-text-btn files-settings-layout-item"+("grid"===e.type?" active":""),onClick:()=>I("grid"),children:[Object(s.jsx)(l.a,{name:"grid",size:"24px"}),Object(s.jsx)("span",{children:"Grid"})]}),Object(s.jsxs)("button",{className:"btn icon-text-btn files-settings-layout-item"+("list"===e.type?" active":""),onClick:()=>I("list"),children:[Object(s.jsx)(l.a,{name:"list",size:"24px"}),Object(s.jsx)("span",{children:"List"})]})]}),Object(s.jsxs)("label",{className:"checkbox-container files-settings-show-categories-setting",children:[Object(s.jsx)("input",{type:"checkbox",className:"sr-only checkbox-input",onChange:F,checked:e.showCategories}),Object(s.jsx)("div",{className:"checkbox",children:Object(s.jsx)("div",{className:"checkbox-tick"})}),Object(s.jsx)("span",{className:"checkbox-label",children:"Show categories"})]})]})]})})]}),Object(s.jsxs)("div",{className:"files-top-bar",children:[Object(s.jsx)(O,{searchFiles:function(n){if(n){const s=u.filter((e=>{var t,s;return e.name.toLowerCase().includes(n)||(null===(t=e.title)||void 0===t?void 0:t.toLowerCase().includes(n))||(null===(s=e.artist)||void 0===s?void 0:s.toLowerCase().includes(n))}));t({...e,matchedFileCount:s.length,searchCategories:s.length?z(s):[]})}else D()},resetSearch:D}),Object(s.jsx)(x,{sortBy:e.sortBy,sortOrder:e.sortOrder,sortFileCatalog:function(n,s=1){if(n===e.sortBy&&s===e.sortOrder)return;const i=Object(o.e)(u,{sortBy:n,sortOrder:s});b(i),t({...e,sortBy:n,sortOrder:s,categories:z(i)}),Object(r.d)({sortBy:n,sortOrder:s})}})]}),m&&Object(s.jsx)(j.a,{notification:m,expandable:m.expandable,dismiss:B,margin:"top",children:m.files?Object(s.jsx)("ul",{className:"files-duplicate-files",children:m.files.map(((e,t)=>Object(s.jsx)("li",{className:"files-duplicate-file",children:e},t)))}):null}),function(){const t=e.searchCategories||e.categories;if("all"===e.visibleCategory&&e.showCategories)return 0===e.matchedFileCount?Object(s.jsx)("p",{className:"files-category-notice",children:"Your search term doesn't match any files."}):Object(s.jsx)("div",{children:t.slice(1).map(((e,t)=>e.files.length?Object(s.jsxs)("div",{className:"files-category",children:[Object(s.jsxs)("h3",{className:"files-category-name",children:[Object(s.jsx)(l.a,{name:e.icon,size:"24px"}),Object(s.jsx)("span",{children:e.name})]}),U(e.files)]},t):null))});const{files:n}=t.find((({id:t})=>t===e.visibleCategory));if(n.length)return U(n);const{files:i}=e.categories.find((({id:t})=>t===e.visibleCategory)),c=e.searchCategories&&i.length?"Your search term doesn't match any files in this category.":"You have no files in this category.";return Object(s.jsx)("p",{className:"files-category-notice",children:c})}()]}):Object(s.jsx)(h,{notification:m,dismiss:B,handleFileUpload:E}),M?Object(s.jsx)(v,{...M,resetProgress:function(){const n=u.find((e=>e.id===M.id));n.status="not started",n.pageNumber=1,"epub"===n.type&&delete n.location,delete n.accessedAt,delete n.scrollLeft,delete n.scrollTop,b([...u]),t({...e,categories:z(u)}),Object(o.d)(n),R()},removeFile:function(){const{id:n}=M,s=u.findIndex((e=>e.id===n));u.splice(s,1),b([...u]),t({...e,categories:z(u)}),Object(o.a)(n),R()},hide:R}):null]}):null:Object(s.jsx)(f,{hide:function(){V(!0)}})}},32:function(e,t,n){"use strict";n.d(t,"a",(function(){return i}));var s=n(3);n(0);function i({name:e,title:t,size:n="20px",className:i,style:c={}}){const a={grid:"M16,5V11H21V5M10,11H15V5H10M16,18H21V12H16M10,18H15V12H10M4,18H9V12H4M4,11H9V5H4V11Z",list:"M9,5V9H21V5M9,19H21V15H9M9,14H21V10H9M4,9H8V5H4M4,19H8V15H4M4,14H8V10H4V14Z",trash:"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z",settings:"M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",menu:"M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z",close:"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z","dots-vertical":"M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z",upload:"M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z","circle-cross":"M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z","circle-check":"M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z",bookshelf:"M9 3V18H12V3H9M12 5L16 18L19 17L15 4L12 5M5 5V18H8V5H5M3 19V21H21V19H3Z",book:"M6.012,18H21V4c0-1.104-0.896-2-2-2H6C4.794,2,3,2.799,3,5v3v6v3v2c0,2.201,1.794,3,3,3h15v-2H6.012 C5.55,19.988,5,19.805,5,19S5.55,18.012,6.012,18z M8,6h9v2H8V6z","open-book":"M19 2L14 6.5V17.5L19 13V2M6.5 5C4.55 5 2.45 5.4 1 6.5V21.16C1 21.41 1.25 21.66 1.5 21.66C1.6 21.66 1.65 21.59 1.75 21.59C3.1 20.94 5.05 20.5 6.5 20.5C8.45 20.5 10.55 20.9 12 22C13.35 21.15 15.8 20.5 17.5 20.5C19.15 20.5 20.85 20.81 22.25 21.56C22.35 21.61 22.4 21.59 22.5 21.59C22.75 21.59 23 21.34 23 21.09V6.5C22.4 6.05 21.75 5.75 21 5.5V19C19.9 18.65 18.7 18.5 17.5 18.5C15.8 18.5 13.35 19.15 12 20V6.5C10.55 5.4 8.45 5 6.5 5Z","book-question-mark":"M19,2H6A2.91,2.91,0,0,0,3,5V19a2.91,2.91,0,0,0,3,3H21V20H6a1,1,0,1,1,0-2H21V4A2,2,0,0,0,19,2ZM13.09,16h-1.8V14.2h1.8Zm2.1-6.2c-.5.6-1.3,1-1.7,1.5a2.54,2.54,0,0,0-.4,1.7h-1.8a4.52,4.52,0,0,1,.4-2.45,7.22,7.22,0,0,1,1.7-1.35c1.45-1.34,1.09-3.24-.9-3.4a1.8,1.8,0,0,0-1.8,1.8H8.89A3.6,3.6,0,0,1,12.49,4,3.48,3.48,0,0,1,15.19,9.8Z","book-check-mark":"M19,2H6A2.91,2.91,0,0,0,3,5V19a2.91,2.91,0,0,0,3,3H21V20H6a1,1,0,1,1,0-2H21V4A2,2,0,0,0,19,2ZM9.61,15.75,5,11.15,7.1,9.06l2.51,2.51,7.31-7.32L19,6.34Z","menu-down":"M7,10L12,15L17,10H7Z",reset:"M12,6V9L16,5L12,1V4A8,8 0 0,0 4,12C4,13.57 4.46,15.03 5.24,16.26L6.7,14.8C6.25,13.97 6,13 6,12A6,6 0 0,1 12,6M18.76,7.74L17.3,9.2C17.74,10.04 18,11 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.43 19.54,8.97 18.76,7.74Z",plus:"M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",minus:"M19,13H5V11H19V13Z","arrow-up":"M13,20H11V8L5.5,13.5L4.08,12.08L12,4.16L19.92,12.08L18.5,13.5L13,8V20Z","arrow-down":"M11,4H13V16L18.5,10.5L19.92,11.92L12,19.84L4.08,11.92L5.5,10.5L11,16V4Z",info:"M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z",exit:"M19,3H5C3.89,3 3,3.89 3,5V9H5V5H19V19H5V15H3V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M10.08,15.58L11.5,17L16.5,12L11.5,7L10.08,8.41L12.67,11H3V13H12.67L10.08,15.58Z",sort:"M3 11H15V13H3M3 18V16H21V18M3 6H9V8H3Z",search:"M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z","chevron-left":"M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z","chevron-right":"M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",page:"M17,22H7a2,2,0,0,1-2-2V4A2,2,0,0,1,7,2H17a2,2,0,0,1,2,2V20A2,2,0,0,1,17,22Z",pages:"M16,4H8A2,2,0,0,1,6,2H18A2,2,0,0,1,16,4Zm2,12V8a2,2,0,0,0-2-2H8A2,2,0,0,0,6,8v8a2,2,0,0,0,2,2h8A2,2,0,0,0,18,16Zm0,6a2,2,0,0,0-2-2H8a2,2,0,0,0-2,2H18Z",spread:"M9,19H4a2,2,0,0,1-2-2V7A2,2,0,0,1,4,5H9a2,2,0,0,1,2,2V17A2,2,0,0,1,9,19Zm13-2V7a2,2,0,0,0-2-2H15a2,2,0,0,0-2,2V17a2,2,0,0,0,2,2h5A2,2,0,0,0,22,17Z",rotate:"M16.89,15.5L18.31,16.89C19.21,15.73 19.76,14.39 19.93,13H17.91C17.77,13.87 17.43,14.72 16.89,15.5M13,17.9V19.92C14.39,19.75 15.74,19.21 16.9,18.31L15.46,16.87C14.71,17.41 13.87,17.76 13,17.9M19.93,11C19.76,9.61 19.21,8.27 18.31,7.11L16.89,8.53C17.43,9.28 17.77,10.13 17.91,11M15.55,5.55L11,1V4.07C7.06,4.56 4,7.92 4,12C4,16.08 7.05,19.44 11,19.93V17.91C8.16,17.43 6,14.97 6,12C6,9.03 8.16,6.57 11,6.09V10L15.55,5.55Z",outline:"M6 4.5A1.5 1.5 0 114.5 3 1.5 1.5 0 016 4.5zM4.5 18A1.5 1.5 0 106 19.5 1.5 1.5 0 004.5 18zm0-5A1.5 1.5 0 106 14.5 1.5 1.5 0 004.5 13zm0-5A1.5 1.5 0 106 9.5 1.5 1.5 0 004.5 8zM19 4.5A1.5 1.5 0 0017.5 3h-8A1.5 1.5 0 008 4.5 1.5 1.5 0 009.5 6h8A1.5 1.5 0 0019 4.5zm-2 5A1.5 1.5 0 0015.5 8h-6A1.5 1.5 0 008 9.5 1.5 1.5 0 009.5 11h6A1.5 1.5 0 0017 9.5zm4 5a1.5 1.5 0 00-1.5-1.5h-10A1.5 1.5 0 008 14.5 1.5 1.5 0 009.5 16h10a1.5 1.5 0 001.5-1.5zm-1 5a1.5 1.5 0 00-1.5-1.5h-9A1.5 1.5 0 008 19.5 1.5 1.5 0 009.5 21h9a1.5 1.5 0 001.5-1.5z",home:"M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"};return c={...c,width:n,height:n},Object(s.jsxs)("svg",{viewBox:"0 0 24 24",className:i,style:c,children:[t&&Object(s.jsx)("title",{children:t}),Object(s.jsx)("path",{d:a[e]})]})}},34:function(e,t,n){"use strict";function s(e){document.title=`${e} | ModestRead`}function i(...e){return e.join(" ").trimEnd()}function c(e,t,n=null){for(;t&&t!==n;){if(t.hasAttribute(e))return{elementRef:t,attrValue:t.getAttribute(e)};t=t.parentElement}}async function a(e){const t=await e.getPage(1),n=document.createElement("canvas");let s=t.getViewport({scale:.4});return s.width<162?s=t.getViewport({scale:64.8/s.width}):s.height>240&&(s=t.getViewport({scale:96/s.height})),n.width=s.width,n.height=s.height,await t.render({canvasContext:n.getContext("2d"),viewport:s}).promise,n.toDataURL("image/jpeg",.8)}async function o(e){const t=await Promise.all([n.e(0),n.e(3),n.e(2)]).then(n.t.bind(null,59,7)),s=await e.arrayBuffer();return t.getDocument(new Uint8Array(s)).promise}function r(e){const t={};return e.info.Title&&(t.title=e.info.Title),e.info.Author&&(t.author=e.info.Author),t}function l(e){return new Promise((t=>{const n=new Image;n.onload=()=>{const e=document.createElement("canvas"),s=e.getContext("2d");e.width=n.width,e.height=n.height,s.drawImage(n,0,0,n.width,n.height),t(e.toDataURL("image/jpeg",.8))},n.width=162,n.height=240,n.src=e}))}async function d(e){const t=await e.coverUrl();if(t)return l(t);await e.opened;for(const[n,s]of Object.entries(e.resources.urls))if(s.toLowerCase().includes("cover"))return l(e.resources.replacementUrls[n]);return new Promise((t=>{const s=document.createElement("div");s.id="area",s.classList.add("files-thumbnail-render-area"),document.body.appendChild(s);const i=e.renderTo("area",{width:684,height:980});i.display(),i.hooks.content.register((async e=>{const{default:i}=await n.e(10).then(n.t.bind(null,60,7)),c=await i(e.content,{width:684});s.remove(),c.toBlob((e=>{t(l(URL.createObjectURL(e)))}),"image/jpeg",.8)}))}))}function u(e){const t=["B","kB","MB","GB"];let n=e,s=0;for(;s<t.length&&!(n<1e3);)n/=1e3,s+=1;return n=s>0?n.toFixed(1):Math.round(n),`${n} ${t[s]}`}function b(e,t,n){for(const s of e)if(parseInt(s.getAttribute("data-page-number"),10)===t)return n(s)}function f(e,t){return b(t,e,(e=>e.getBoundingClientRect()))}function j(e,t,{keepToolbarVisible:n,scrollLeft:s=document.documentElement.scrollLeft}){b(t,e,(t=>{const i=n||1===e?40:0;window.scrollTo(s,t.offsetTop-i)}))}function m(){const e=document.createElement("div"),t=document.createElement("div");e.style.visibility="hidden",e.style.overflow="scroll",e.appendChild(t),document.body.appendChild(e);const n=e.offsetWidth-t.offsetWidth;return e.remove(),n}function h(e,t){const n=new CustomEvent(e,{detail:t});window.dispatchEvent(n)}n.d(t,"l",(function(){return s})),n.d(t,"a",(function(){return i})),n.d(t,"c",(function(){return c})),n.d(t,"i",(function(){return a})),n.d(t,"g",(function(){return o})),n.d(t,"j",(function(){return r})),n.d(t,"d",(function(){return d})),n.d(t,"e",(function(){return u})),n.d(t,"f",(function(){return f})),n.d(t,"k",(function(){return j})),n.d(t,"h",(function(){return m})),n.d(t,"b",(function(){return h}))},38:function(e,t,n){"use strict";n.d(t,"b",(function(){return i})),n.d(t,"a",(function(){return c})),n.d(t,"d",(function(){return a})),n.d(t,"c",(function(){return o}));const s=JSON.parse(localStorage.getItem("modest-read-settings"))||{sortBy:"last-accessed",sortOrder:1,showCategories:!1,layoutType:"grid",invertColors:!1,keepToolbarVisible:!1};function i(){return s}function c(e){return s[e]}function a(e){Object.assign(s,e),r()}function o(e,t){s[e]=t,r()}function r(){localStorage.setItem("modest-read-settings",JSON.stringify(s))}},39:function(e,t,n){"use strict";var s=n(3),i=(n(0),n.p+"static/media/icon-text.8d796bce.svg");n(41);t.a=function(){return Object(s.jsx)("img",{src:i,className:"banner-image",alt:""})}},40:function(e,t,n){"use strict";n.d(t,"c",(function(){return c})),n.d(t,"b",(function(){return a})),n.d(t,"d",(function(){return o})),n.d(t,"a",(function(){return r})),n.d(t,"e",(function(){return d}));var s=n(46);const i=new s.a("ModestKeep","files");function c(e){return Object(s.d)(i).then((e=>Promise.all(e.map(a)))).then((t=>e?d(t,e):t)).catch((e=>(console.log(e),[])))}function a(e){return Object(s.c)(e,i)}function o(e){Object(s.e)(e.id,e,i)}function r(e){return Object(s.b)(e,i).then((()=>!0))}function l(e,t){return"last-accessed"===e?Math.max(t.accessedAt||0,t.createdAt):"file-size"===e?t.size:"file-name"===e?t.name.toLowerCase().replace(/[^\w\s]/gi,""):void 0}function d(e,{sortBy:t,sortOrder:n}){return"last-accessed"===t?function(e,t,n){const[s,i]=e.reduce(((e,t)=>("reading"===t.status?e[0].push(t):e[1].push(t),e)),[[],[]]);return u(s,t,n).concat(u(i,t,n))}(e,t,-n):u(e,t,n)}function u(e,t,n){return[...e].sort(((e,s)=>{const i=l(t,e),c=l(t,s);return i<c?-n:i>c?n:0}))}},41:function(e,t,n){},43:function(e,t,n){"use strict";var s=n(3),i=n(0),c=(n(51),n(138)),a=n(34);t.a=function({container:e,toggle:t,body:n,children:o}){const[r,l]=Object(i.useState)({id:Object(c.a)()}),d=Object(i.useCallback)((function({target:e}){const t=e.closest(".dropdown-container");let n=!0;(null===t||void 0===t?void 0:t.id)===r.id&&(n=!e.closest("[data-dropdown-keep]")&&(e.closest("a")||e.closest(".dropdown-btn")));n&&(u.current&&l({id:r.id,visible:!1,reveal:!1}),window.removeEventListener("click",d))}),[r.id]),u=Object(i.useRef)(!1),b=Object(i.useRef)(null);return Object(i.useEffect)((()=>(u.current=!0,()=>{u.current=!1,window.removeEventListener("click",d)})),[d]),Object(i.useEffect)((()=>{if(r.reveal){const e=document.documentElement.offsetHeight,t=b.current.getBoundingClientRect().height;l({...r,onTop:r.top+t>e,visible:!0}),Object(a.b)("dropdown-visible",{id:r.id,hide:()=>l({id:r.id,visible:!1,reveal:!1})})}}),[r.reveal]),Object(s.jsxs)("div",{id:r.id,className:"dropdown-container"+(e?` ${e.className}`:""),children:[Object(s.jsx)("button",{onClick:function({currentTarget:e}){let t=0;r.visible?window.removeEventListener("click",d):(window.addEventListener("click",d),t=e.getBoundingClientRect().bottom),l({id:r.id,visible:!1,reveal:!r.visible,top:t,onTop:!1})},title:t.title,className:`${t.className}${r.visible?" active":""}`,children:t.content}),Object(s.jsx)("div",{ref:b,className:`dropdown${n?` ${n.className}`:""}${r.reveal?" reveal":""}${r.visible?" visible":""}${r.onTop?" top":""}`,children:o})]})}},44:function(e,t,n){"use strict";var s=n(3),i=n(0),c=(n(52),n(34)),a=n(32);t.a=function({notification:e,expandable:t,className:n="",margin:o,children:r,dismiss:l}){const[d,u]=Object(i.useState)(e),[b,f]=Object(i.useState)(!1),j=e.type||"negative";return Object(i.useEffect)((()=>{if(!d.flashing&&d!==e){if(d.value!==e.value)return void u(e);u({...d,flashing:!0}),setTimeout((()=>{u(e)}),640)}}),[d,e]),Object(s.jsxs)("div",{className:Object(c.a)("notification",n,j,o?`margin-${o}`:"",b?"expanded":"",d.flashing?"flash":""),children:[Object(s.jsx)(a.a,{name:"negative"===j?"circle-cross":"circle-check",className:"notification-icon",size:"24px"}),t?Object(s.jsxs)("div",{className:"notification-expandable-content-container",children:[Object(s.jsxs)("div",{className:"notification-expandable-content",children:[Object(s.jsx)("span",{children:e.value}),Object(s.jsx)("button",{className:"btn icon-btn notification-btn notification-expand-btn",onClick:function(){f(!b)},title:"Details",style:{transform:`rotateZ(${b?"180deg":"0"})`},children:Object(s.jsx)(a.a,{name:"menu-down"})})]}),b&&r]}):Object(s.jsx)("span",{className:"notification-text",children:d.value}),Object(s.jsx)("button",{type:"button",className:"btn icon-btn notification-btn notification-dismiss-btn",onClick:l,title:"Dismiss",children:Object(s.jsx)(a.a,{name:"close"})})]})}},46:function(e,t,n){"use strict";n.d(t,"a",(function(){return s})),n.d(t,"c",(function(){return a})),n.d(t,"e",(function(){return o})),n.d(t,"b",(function(){return r})),n.d(t,"d",(function(){return l}));class s{constructor(e="keyval-store",t="keyval"){this.storeName=t,this._dbp=new Promise(((n,s)=>{const i=indexedDB.open(e,1);i.onerror=()=>s(i.error),i.onsuccess=()=>n(i.result),i.onupgradeneeded=()=>{i.result.createObjectStore(t)}}))}_withIDBStore(e,t){return this._dbp.then((n=>new Promise(((s,i)=>{const c=n.transaction(this.storeName,e);c.oncomplete=()=>s(),c.onabort=c.onerror=()=>i(c.error),t(c.objectStore(this.storeName))}))))}}let i;function c(){return i||(i=new s),i}function a(e,t=c()){let n;return t._withIDBStore("readonly",(t=>{n=t.get(e)})).then((()=>n.result))}function o(e,t,n=c()){return n._withIDBStore("readwrite",(n=>{n.put(t,e)}))}function r(e,t=c()){return t._withIDBStore("readwrite",(t=>{t.delete(e)}))}function l(e=c()){const t=[];return e._withIDBStore("readonly",(e=>{(e.openKeyCursor||e.openCursor).call(e).onsuccess=function(){this.result&&(t.push(this.result.key),this.result.continue())}})).then((()=>t))}},51:function(e,t,n){},52:function(e,t,n){},53:function(e,t,n){},63:function(e,t,n){"use strict";var s=n(3),i=(n(0),n(13));n(53);t.a=function({file:e,showLink:t,children:n}){return Object(s.jsxs)("li",{className:"file-card",children:[t?Object(s.jsx)(i.b,{to:`/viewer/${e.id}`,className:"file-card-left",title:`Open ${e.name}`,children:Object(s.jsx)("img",{src:e.coverImage,className:"file-card-image",alt:""})}):Object(s.jsx)("div",{className:"file-card-left",children:Object(s.jsx)("img",{src:e.coverImage,className:"file-card-image",alt:""})}),Object(s.jsxs)("div",{className:"file-card-info",children:[Object(s.jsx)("div",{className:"file-card-title",children:e.title||e.name}),e.author&&Object(s.jsx)("div",{className:"file-card-author",children:e.author}),Object(s.jsxs)("div",{className:"file-card-secondary-info",children:[e.title&&Object(s.jsx)("div",{className:"file-card-secondary-info-item file-card-filename",children:e.name}),Object(s.jsx)("div",{className:"file-card-secondary-info-item",children:e.sizeString})]}),Object(s.jsx)("div",{className:"file-card-progress-container",title:`${e.pageNumber} of ${e.pageCount} page${1===e.pageCount?"":"s"} read`,children:Object(s.jsx)("div",{className:"file-card-progress",children:Object(s.jsx)("div",{className:"file-card-progress-bar",style:{left:(e.pageNumber-1)/e.pageCount*100+"%"}})})}),Object(s.jsx)("div",{className:"file-card-bottom",children:n})]})]})}},76:function(e,t,n){},77:function(e,t,n){},78:function(e,t,n){},79:function(e,t,n){},80:function(e,t,n){},81:function(e,t,n){},82:function(e,t,n){}}]);