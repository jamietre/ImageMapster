/* when */
/** @license MIT License (c) copyright B Cavalier & J Hann */
(function(a){a(function(){var g,n,q;function j(){}function c(s){return new Array(s);
}g=Object.freeze||function(s){return s;};n=[].reduce||function(x){var t,s,w,v,u;u=0;
t=Object(this);v=t.length>>>0;s=arguments;if(s.length<=1){for(;;){if(u in t){w=t[u++];
break;}if(++u>=v){throw new TypeError();}}}else{w=s[1];}for(;u<v;++u){if(u in t){w=x(w,t[u],u,t);
}}return w;};function l(){}function f(){var v,A,D,w,z,t,s,u;w=[];z=[];t=function F(H,J,L){var G,I,K=arguments.length;
while(K){G=arguments[--K];if(G!=null&&typeof G!="function"){throw new Error("callback is not a function");
}}I=f();w.push({deferred:I,resolve:H,reject:J});L&&z.push(L);return I.promise;};function E(G,H,I){return t(G,H,I);
}function C(G){u("resolve",G);}function B(G){u("reject",G);}s=function(I){var H,G=0;
while(H=z[G++]){H(I);}};function y(G){s(G);}u=function(K,J){var I=t;t=function H(L,M){var N=I(L,M);
x(K);return N;};u=s=function G(){throw new Error("already completed");};z=q;D=J;x(K);
};function x(N){var K,J,M,H,L,I=0;L=w;w=[];while(K=L[I++]){J=K.deferred;H=K[N];try{M=H?H(D):D;
if(h(M)){r(M,J.resolve,J.reject,J.progress);}else{J[N](M===q?D:M);}}catch(G){J.reject(G);
}}}v=new l();A=new l();A.then=v.then=E;v.promise=g(A);v.resolver=g({resolve:(v.resolve=C),reject:(v.reject=B),progress:(v.progress=y)});
if(arguments&&arguments.length){E.apply(null,arguments);}return v;}function h(s){return s&&typeof s.then==="function";
}function r(v,s,t,u){var w=k(v);return w.then(s,t,u);}function k(u){var t,s;if(u instanceof l){t=u;
}else{s=f();if(h(u)){u.then(s.resolve,s.reject,s.progress);}else{s.resolve(u);}t=s.promise;
}return t;}function p(C,x,s,v,B){var J,H,I,u,G,E,w,z,y;z=C.length>>>0;J=Math.max(0,Math.min(x,z));
H=[];u=f();I=r(u,s,v,B);function F(K){G(K);}function D(K){E(K);}function A(K){w(K);
}function t(){G=E=w=j;}if(!J){u.resolve(H);}else{G=function(K){H.push(K);if(!--J){t();
u.resolve(H);}};E=function(K){t();u.reject(K);};w=u.progress;for(y=0;y<z;++y){if(y in C){r(C[y],F,D,A);
}}}return I;}function b(w,s,t,u){var x,v;x=c(w.length);v=m(w,o,x);return r(v,s,t,u);
}function o(s,u,t){s[t]=u;return s;}function d(v,s,t,u){function w(x){return s(x[0]);
}return p(v,1,w,t,u);}function i(u,t){var v,s;s=u.length;v=c(s);for(;s>=0;--s){if(s in u){v[s]=r(u[s],t);
}}return m(v,o,v);}function m(u,v,t){var w,s;w=u.length;s=[function(x,z,y){return r(x,function(A){return r(z,function(B){return v(A,B,y,w);
});});}];if(arguments.length>=3){s.push(t);}return k(n.apply(u,s));}function e(s,t,u){var v=arguments.length>2;
return r(s,function(w){t.resolve(v?u:w);},t.reject,t.progress);}r.defer=f;r.isPromise=h;
r.some=p;r.all=b;r.any=d;r.reduce=m;r.map=i;r.chain=e;return r;});})(typeof define=="function"?define:function(a){typeof module!="undefined"?(module.exports=a()):(this.when=a());
});


(function(define) {
define(['./when'], function(when) {

    var undef;

    /**
     * Returns a new promise that will automatically reject after msec if
     * the supplied promise doesn't resolve or reject before that.
     *
     * Usage:
     *
     * var d = when.defer();
     * // Setup d however you need
     *
     * // return a new promise that will timeout if we don't resolve/reject first
     * return timeout(d, 1000);
     *
     * @param promise anything - any promise or value that should trigger
     *  the returned promise to resolve or reject before the msec timeout
     * @param msec {Number} timeout in milliseconds
     *
     * @returns {Promise}
     */
    return function timeout(promise, msec) {
        var deferred, timeout;

        deferred = when.defer();

        timeout = setTimeout(function onTimeout() {
            timeout && deferred.reject(new Error('timed out'));
        }, msec);

        function cancelTimeout() {
            clearTimeout(timeout);
            timeout = undef;
        }

        when(promise, deferred.resolve, deferred.reject);

        return deferred.then(
            function(value) {
                cancelTimeout();
                return value;
            },
            function(reason) {
                cancelTimeout();
                throw reason;
            }
        );
    };

});
})(typeof define == 'function'
    ? define
    : function (deps, factory) { typeof module != 'undefined'
        ? (module.exports = factory(require('./when')))
        : (this.when_timeout = factory(this.when));
    }
    // Boilerplate for AMD, Node, and browser global
);
