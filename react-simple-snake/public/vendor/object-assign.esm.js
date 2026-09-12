/**
 * Bundled by jsDelivr using Rollup v4.62.2 and esbuild v0.28.1.
 * Original file: /npm/object-assign@4.1.1/index.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
var f,i;function O(){if(i)return f;i=1;var u=Object.getOwnPropertySymbols,b=Object.prototype.hasOwnProperty,l=Object.prototype.propertyIsEnumerable;function j(n){if(n==null)throw new TypeError("Object.assign cannot be called with null or undefined");return Object(n)}function p(){try{if(!Object.assign)return!1;var n=new String("abc");if(n[5]="de",Object.getOwnPropertyNames(n)[0]==="5")return!1;for(var s={},r=0;r<10;r++)s["_"+String.fromCharCode(r)]=r;var a=Object.getOwnPropertyNames(s).map(function(e){return s[e]});if(a.join("")!=="0123456789")return!1;var t={};return"abcdefghijklmnopqrst".split("").forEach(function(e){t[e]=e}),Object.keys(Object.assign({},t)).join("")==="abcdefghijklmnopqrst"}catch{return!1}}return f=p()?Object.assign:function(n,s){for(var r,a=j(n),t,e=1;e<arguments.length;e++){r=Object(arguments[e]);for(var c in r)b.call(r,c)&&(a[c]=r[c]);if(u){t=u(r);for(var o=0;o<t.length;o++)l.call(r,t[o])&&(a[t[o]]=r[t[o]])}}return a},f}var g=O();export{g as default};
//# sourceMappingURL=/sm/da97150335cb3968e596e9f7289c7deb90af67dd9e50be8ba731fb6cb4c8470c.map