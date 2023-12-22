"use strict";(()=>{var x=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var h=(e,t,n)=>new Promise((o,c)=>{var l=s=>{try{u(n.next(s))}catch(y){c(y)}},d=s=>{try{u(n.throw(s))}catch(y){c(y)}},u=s=>s.done?o(s.value):Promise.resolve(s.value).then(l,d);u((n=n.apply(e,t)).next())});var L=x(q=>{var S=document.querySelector("#loader"),m=e=>{S&&(S.style.width=`${e}%`)},E=e=>{m(100);let t=document.querySelector("#result");if(t){let n=t.querySelector(".content");n&&(n.textContent=e),f(),t.style.opacity="100%"}},C=()=>{let e=document.querySelector("#result");e&&(e.style.opacity="0")},f=(e="Copy")=>{let t=document.querySelector("#result .copy span");t&&(t.textContent=e)},g=document.querySelector("#result > a.copy");g==null||g.addEventListener("click",e=>h(q,null,function*(){var o;e.preventDefault();let t=e.currentTarget.parentElement,n=(o=t==null?void 0:t.querySelector(".content"))==null?void 0:o.textContent;if(n)try{yield navigator.clipboard.writeText(n),f("Copied!")}catch(c){f("Error: You will have to copy manually :(")}}));var a=document.querySelector("textarea");a==null||a.addEventListener("input",()=>{let e=document.querySelector("#character-count");if(e){let t=a.value.length;t===1?e.textContent="1 character":e.textContent=`${t} characters`}});function v(e,t){return h(this,null,function*(){let n=new TextEncoder().encode(e),o=yield crypto.subtle.digest(t,n);return Array.from(new Uint8Array(o)).map(d=>d.toString(16).padStart(2,"0")).join("")})}var p=document.querySelector("button");p==null||p.addEventListener("click",()=>{m(0);let e=a==null?void 0:a.value;e&&r.alg&&v(e,r.alg).then(t=>{E(t)})});var r,i=document.querySelector("#digest-select");i==null||i.addEventListener("change",e=>{let t=document.querySelector("#digest-menu"),n=t==null?void 0:t.querySelector("#digest-output-length span"),o=t==null?void 0:t.querySelector("#digest-block-size span"),c=t==null?void 0:t.querySelector("#digest-method span"),l=t==null?void 0:t.querySelector("#digest-specification span");r=i.selectedOptions[0].dataset,n&&(n.textContent=r.ol||""),o&&(o.textContent=r.bs||""),c&&(c.textContent=r.method||""),l&&(l.textContent=r.spec||""),C()});document.addEventListener("DOMContentLoaded",()=>{i.dispatchEvent(new Event("change"))})});L();})();
//# sourceMappingURL=script.js.map
