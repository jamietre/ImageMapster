document.createElement("canvas").getContext||function(){function Z(){return this.context_||(this.context_=new C(this))}function $(a,b){var c=P.call(arguments,2);return function(){return a.apply(b,c.concat(P.call(arguments)))}}function Q(a){return String(a).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}function R(a,b,c){a.namespaces[b]||a.namespaces.add(b,c,"#default#VML")}function S(a){R(a,"g_vml_","urn:schemas-microsoft-com:vml");R(a,"g_o_","urn:schemas-microsoft-com:office:office");if(!a.styleSheets.ex_canvas_){a=
a.createStyleSheet();a.owningElement.id="ex_canvas_";a.cssText="canvas{display:inline-block;overflow:hidden;text-align:left;width:300px;height:150px}"}}function aa(a){var b=a.srcElement;switch(a.propertyName){case "width":b.getContext().clearRect();b.style.width=b.attributes.width.nodeValue+"px";b.firstChild.style.width=b.clientWidth+"px";break;case "height":b.getContext().clearRect();b.style.height=b.attributes.height.nodeValue+"px";b.firstChild.style.height=b.clientHeight+"px";break}}function ba(a){a=
a.srcElement;if(a.firstChild){a.firstChild.style.width=a.clientWidth+"px";a.firstChild.style.height=a.clientHeight+"px"}}function D(){return[[1,0,0],[0,1,0],[0,0,1]]}function u(a,b){for(var c=D(),d=0;d<3;d++)for(var e=0;e<3;e++){for(var f=0,h=0;h<3;h++)f+=a[d][h]*b[h][e];c[d][e]=f}return c}function T(a,b){b.fillStyle=a.fillStyle;b.lineCap=a.lineCap;b.lineJoin=a.lineJoin;b.lineWidth=a.lineWidth;b.miterLimit=a.miterLimit;b.shadowBlur=a.shadowBlur;b.shadowColor=a.shadowColor;b.shadowOffsetX=a.shadowOffsetX;
b.shadowOffsetY=a.shadowOffsetY;b.strokeStyle=a.strokeStyle;b.globalAlpha=a.globalAlpha;b.font=a.font;b.textAlign=a.textAlign;b.textBaseline=a.textBaseline;b.arcScaleX_=a.arcScaleX_;b.arcScaleY_=a.arcScaleY_;b.lineScale_=a.lineScale_}function U(a){var b=a.indexOf("(",3),c=a.indexOf(")",b+1);b=a.substring(b+1,c).split(",");if(b.length!=4||a.charAt(3)!="a")b[3]=1;return b}function E(a){return parseFloat(a)/100}function F(a,b,c){return Math.min(c,Math.max(b,a))}function ca(a){var b,c;c=parseFloat(a[0])/
360%360;c<0&&c++;b=F(E(a[1]),0,1);a=F(E(a[2]),0,1);if(b==0)b=a=c=a;else{var d=a<0.5?a*(1+b):a+b-a*b,e=2*a-d;b=G(e,d,c+1/3);a=G(e,d,c);c=G(e,d,c-1/3)}return"#"+v[Math.floor(b*255)]+v[Math.floor(a*255)]+v[Math.floor(c*255)]}function G(a,b,c){c<0&&c++;c>1&&c--;return 6*c<1?a+(b-a)*6*c:2*c<1?b:3*c<2?a+(b-a)*(2/3-c)*6:a}function H(a){if(a in I)return I[a];var b,c=1;a=String(a);if(a.charAt(0)=="#")b=a;else if(/^rgb/.test(a)){c=U(a);b="#";for(var d,e=0;e<3;e++){d=c[e].indexOf("%")!=-1?Math.floor(E(c[e])*
255):+c[e];b+=v[F(d,0,255)]}c=+c[3]}else if(/^hsl/.test(a)){c=U(a);b=ca(c);c=c[3]}else b=da[a]||a;return I[a]={color:b,alpha:c}}function ea(a){if(J[a])return J[a];var b=document.createElement("div").style;try{b.font=a}catch(c){}return J[a]={style:b.fontStyle||w.style,variant:b.fontVariant||w.variant,weight:b.fontWeight||w.weight,size:b.fontSize||w.size,family:b.fontFamily||w.family}}function fa(a,b){var c={};for(var d in a)c[d]=a[d];b=parseFloat(b.currentStyle.fontSize);d=parseFloat(a.size);c.size=
typeof a.size=="number"?a.size:a.size.indexOf("px")!=-1?d:a.size.indexOf("em")!=-1?b*d:a.size.indexOf("%")!=-1?b/100*d:a.size.indexOf("pt")!=-1?d/0.75:b;c.size*=0.981;return c}function ga(a){return a.style+" "+a.variant+" "+a.weight+" "+a.size+"px "+a.family}function ha(a){return ia[a]||"square"}function C(a){this.m_=D();this.mStack_=[];this.aStack_=[];this.currentPath_=[];this.fillStyle=this.strokeStyle="#000";this.lineWidth=1;this.lineJoin="miter";this.lineCap="butt";this.miterLimit=l*1;this.globalAlpha=
1;this.font="10px sans-serif";this.textAlign="left";this.textBaseline="alphabetic";this.canvas=a;var b="width:"+a.clientWidth+"px;height:"+a.clientHeight+"px;overflow:hidden;position:absolute",c=a.ownerDocument.createElement("div");c.style.cssText=b;a.appendChild(c);b=c.cloneNode(false);b.style.backgroundColor="red";b.style.filter="alpha(opacity=0)";a.appendChild(b);this.element_=c;this.lineScale_=this.arcScaleY_=this.arcScaleX_=1}function V(a,b,c,d){a.currentPath_.push({type:"bezierCurveTo",cp1x:b.x,
cp1y:b.y,cp2x:c.x,cp2y:c.y,x:d.x,y:d.y});a.currentX_=d.x;a.currentY_=d.y}function W(a,b){var c=H(a.strokeStyle),d=c.color;c=c.alpha*a.globalAlpha;var e=a.lineScale_*a.lineWidth;if(e<1)c*=e;b.push("<g_vml_:stroke",' opacity="',c,'"',' joinstyle="',a.lineJoin,'"',' miterlimit="',a.miterLimit,'"',' endcap="',ha(a.lineCap),'"',' weight="',e,'px"',' color="',d,'" />')}function X(a,b,c,d){var e=a.fillStyle,f=a.arcScaleX_,h=a.arcScaleY_,j=d.x-c.x,m=d.y-c.y;if(e instanceof x){var k=0;d={x:0,y:0};var q=0,
o=1;if(e.type_=="gradient"){k=e.x1_/f;c=e.y1_/h;var n=p(a,e.x0_/f,e.y0_/h);k=p(a,k,c);k=Math.atan2(k.x-n.x,k.y-n.y)*180/Math.PI;if(k<0)k+=360;if(k<1.0E-6)k=0}else{n=p(a,e.x0_,e.y0_);d={x:(n.x-c.x)/j,y:(n.y-c.y)/m};j/=f*l;m/=h*l;o=r.max(j,m);q=2*e.r0_/o;o=2*e.r1_/o-q}f=e.colors_;f.sort(function(A,ja){return A.offset-ja.offset});h=f.length;n=f[0].color;c=f[h-1].color;j=f[0].alpha*a.globalAlpha;a=f[h-1].alpha*a.globalAlpha;m=[];for(var s=0;s<h;s++){var y=f[s];m.push(y.offset*o+q+" "+y.color)}b.push('<g_vml_:fill type="',
e.type_,'"',' method="none" focus="100%"',' color="',n,'"',' color2="',c,'"',' colors="',m.join(","),'"',' opacity="',a,'"',' g_o_:opacity2="',j,'"',' angle="',k,'"',' focusposition="',d.x,",",d.y,'" />')}else if(e instanceof K)j&&m&&b.push("<g_vml_:fill",' position="',-c.x/j*f*f,",",-c.y/m*h*h,'"',' type="tile"',' src="',e.src_,'" />');else{e=H(a.fillStyle);b.push('<g_vml_:fill color="',e.color,'" opacity="',e.alpha*a.globalAlpha,'" />')}}function p(a,b,c){a=a.m_;return{x:l*(b*a[0][0]+c*a[1][0]+
a[2][0])-t,y:l*(b*a[0][1]+c*a[1][1]+a[2][1])-t}}function ka(a){return isFinite(a[0][0])&&isFinite(a[0][1])&&isFinite(a[1][0])&&isFinite(a[1][1])&&isFinite(a[2][0])&&isFinite(a[2][1])}function z(a,b,c){if(ka(b)){a.m_=b;if(c)a.lineScale_=la(ma(b[0][0]*b[1][1]-b[0][1]*b[1][0]))}}function x(a){this.type_=a;this.r1_=this.y1_=this.x1_=this.r0_=this.y0_=this.x0_=0;this.colors_=[]}function K(a,b){na(a);switch(b){case "repeat":case null:case "":this.repetition_="repeat";break;case "repeat-x":case "repeat-y":case "no-repeat":this.repetition_=
b;break;default:L("SYNTAX_ERR")}this.src_=a.src;this.width_=a.width;this.height_=a.height}function L(a){throw new M(a);}function na(a){if(!a||a.nodeType!=1||a.tagName!="IMG")L("TYPE_MISMATCH_ERR");a.readyState!="complete"&&L("INVALID_STATE_ERR")}function M(a){this.code=this[a];this.message=a+": DOM Exception "+this.code}var r=Math,i=r.round,N=r.sin,O=r.cos,ma=r.abs,la=r.sqrt,l=10,t=l/2;navigator.userAgent.match(/MSIE ([\d.]+)?/);var P=Array.prototype.slice;S(document);var Y={init:function(a){a=a||
document;a.createElement("canvas");a.attachEvent("onreadystatechange",$(this.init_,this,a))},init_:function(a){a=a.getElementsByTagName("canvas");for(var b=0;b<a.length;b++)this.initElement(a[b])},initElement:function(a){if(!a.getContext){a.getContext=Z;S(a.ownerDocument);a.innerHTML="";a.attachEvent("onpropertychange",aa);a.attachEvent("onresize",ba);var b=a.attributes;if(b.width&&b.width.specified)a.style.width=b.width.nodeValue+"px";else a.width=a.clientWidth;if(b.height&&b.height.specified)a.style.height=
b.height.nodeValue+"px";else a.height=a.clientHeight}return a}};Y.init();for(var v=[],g=0;g<16;g++)for(var B=0;B<16;B++)v[g*16+B]=g.toString(16)+B.toString(16);var da={aliceblue:"#F0F8FF",antiquewhite:"#FAEBD7",aquamarine:"#7FFFD4",azure:"#F0FFFF",beige:"#F5F5DC",bisque:"#FFE4C4",black:"#000000",blanchedalmond:"#FFEBCD",blueviolet:"#8A2BE2",brown:"#A52A2A",burlywood:"#DEB887",cadetblue:"#5F9EA0",chartreuse:"#7FFF00",chocolate:"#D2691E",coral:"#FF7F50",cornflowerblue:"#6495ED",cornsilk:"#FFF8DC",crimson:"#DC143C",
cyan:"#00FFFF",darkblue:"#00008B",darkcyan:"#008B8B",darkgoldenrod:"#B8860B",darkgray:"#A9A9A9",darkgreen:"#006400",darkgrey:"#A9A9A9",darkkhaki:"#BDB76B",darkmagenta:"#8B008B",darkolivegreen:"#556B2F",darkorange:"#FF8C00",darkorchid:"#9932CC",darkred:"#8B0000",darksalmon:"#E9967A",darkseagreen:"#8FBC8F",darkslateblue:"#483D8B",darkslategray:"#2F4F4F",darkslategrey:"#2F4F4F",darkturquoise:"#00CED1",darkviolet:"#9400D3",deeppink:"#FF1493",deepskyblue:"#00BFFF",dimgray:"#696969",dimgrey:"#696969",dodgerblue:"#1E90FF",
firebrick:"#B22222",floralwhite:"#FFFAF0",forestgreen:"#228B22",gainsboro:"#DCDCDC",ghostwhite:"#F8F8FF",gold:"#FFD700",goldenrod:"#DAA520",grey:"#808080",greenyellow:"#ADFF2F",honeydew:"#F0FFF0",hotpink:"#FF69B4",indianred:"#CD5C5C",indigo:"#4B0082",ivory:"#FFFFF0",khaki:"#F0E68C",lavender:"#E6E6FA",lavenderblush:"#FFF0F5",lawngreen:"#7CFC00",lemonchiffon:"#FFFACD",lightblue:"#ADD8E6",lightcoral:"#F08080",lightcyan:"#E0FFFF",lightgoldenrodyellow:"#FAFAD2",lightgreen:"#90EE90",lightgrey:"#D3D3D3",
lightpink:"#FFB6C1",lightsalmon:"#FFA07A",lightseagreen:"#20B2AA",lightskyblue:"#87CEFA",lightslategray:"#778899",lightslategrey:"#778899",lightsteelblue:"#B0C4DE",lightyellow:"#FFFFE0",limegreen:"#32CD32",linen:"#FAF0E6",magenta:"#FF00FF",mediumaquamarine:"#66CDAA",mediumblue:"#0000CD",mediumorchid:"#BA55D3",mediumpurple:"#9370DB",mediumseagreen:"#3CB371",mediumslateblue:"#7B68EE",mediumspringgreen:"#00FA9A",mediumturquoise:"#48D1CC",mediumvioletred:"#C71585",midnightblue:"#191970",mintcream:"#F5FFFA",
mistyrose:"#FFE4E1",moccasin:"#FFE4B5",navajowhite:"#FFDEAD",oldlace:"#FDF5E6",olivedrab:"#6B8E23",orange:"#FFA500",orangered:"#FF4500",orchid:"#DA70D6",palegoldenrod:"#EEE8AA",palegreen:"#98FB98",paleturquoise:"#AFEEEE",palevioletred:"#DB7093",papayawhip:"#FFEFD5",peachpuff:"#FFDAB9",peru:"#CD853F",pink:"#FFC0CB",plum:"#DDA0DD",powderblue:"#B0E0E6",rosybrown:"#BC8F8F",royalblue:"#4169E1",saddlebrown:"#8B4513",salmon:"#FA8072",sandybrown:"#F4A460",seagreen:"#2E8B57",seashell:"#FFF5EE",sienna:"#A0522D",
skyblue:"#87CEEB",slateblue:"#6A5ACD",slategray:"#708090",slategrey:"#708090",snow:"#FFFAFA",springgreen:"#00FF7F",steelblue:"#4682B4",tan:"#D2B48C",thistle:"#D8BFD8",tomato:"#FF6347",turquoise:"#40E0D0",violet:"#EE82EE",wheat:"#F5DEB3",whitesmoke:"#F5F5F5",yellowgreen:"#9ACD32"},I={},w={style:"normal",variant:"normal",weight:"normal",size:10,family:"sans-serif"},J={},ia={butt:"flat",round:"round"};g=C.prototype;g.clearRect=function(){if(this.textMeasureEl_){this.textMeasureEl_.removeNode(true);this.textMeasureEl_=
null}this.element_.innerHTML=""};g.beginPath=function(){this.currentPath_=[]};g.moveTo=function(a,b){a=p(this,a,b);this.currentPath_.push({type:"moveTo",x:a.x,y:a.y});this.currentX_=a.x;this.currentY_=a.y};g.lineTo=function(a,b){a=p(this,a,b);this.currentPath_.push({type:"lineTo",x:a.x,y:a.y});this.currentX_=a.x;this.currentY_=a.y};g.bezierCurveTo=function(a,b,c,d,e,f){e=p(this,e,f);a=p(this,a,b);c=p(this,c,d);V(this,a,c,e)};g.quadraticCurveTo=function(a,b,c,d){a=p(this,a,b);c=p(this,c,d);d={x:this.currentX_+
2/3*(a.x-this.currentX_),y:this.currentY_+2/3*(a.y-this.currentY_)};V(this,d,{x:d.x+(c.x-this.currentX_)/3,y:d.y+(c.y-this.currentY_)/3},c)};g.arc=function(a,b,c,d,e,f){c*=l;var h=f?"at":"wa",j=a+O(d)*c-t,m=b+N(d)*c-t;d=a+O(e)*c-t;e=b+N(e)*c-t;if(j==d&&!f)j+=0.125;a=p(this,a,b);j=p(this,j,m);d=p(this,d,e);this.currentPath_.push({type:h,x:a.x,y:a.y,radius:c,xStart:j.x,yStart:j.y,xEnd:d.x,yEnd:d.y})};g.rect=function(a,b,c,d){this.moveTo(a,b);this.lineTo(a+c,b);this.lineTo(a+c,b+d);this.lineTo(a,b+d);
this.closePath()};g.strokeRect=function(a,b,c,d){var e=this.currentPath_;this.beginPath();this.moveTo(a,b);this.lineTo(a+c,b);this.lineTo(a+c,b+d);this.lineTo(a,b+d);this.closePath();this.stroke();this.currentPath_=e};g.fillRect=function(a,b,c,d){var e=this.currentPath_;this.beginPath();this.moveTo(a,b);this.lineTo(a+c,b);this.lineTo(a+c,b+d);this.lineTo(a,b+d);this.closePath();this.fill();this.currentPath_=e};g.createLinearGradient=function(a,b,c,d){var e=new x("gradient");e.x0_=a;e.y0_=b;e.x1_=
c;e.y1_=d;return e};g.createRadialGradient=function(a,b,c,d,e,f){var h=new x("gradientradial");h.x0_=a;h.y0_=b;h.r0_=c;h.x1_=d;h.y1_=e;h.r1_=f;return h};g.drawImage=function(a){var b,c,d,e,f,h,j,m;d=a.runtimeStyle.width;e=a.runtimeStyle.height;a.runtimeStyle.width="auto";a.runtimeStyle.height="auto";var k=a.width,q=a.height;a.runtimeStyle.width=d;a.runtimeStyle.height=e;if(arguments.length==3){b=arguments[1];c=arguments[2];f=h=0;j=d=k;m=e=q}else if(arguments.length==5){b=arguments[1];c=arguments[2];
d=arguments[3];e=arguments[4];f=h=0;j=k;m=q}else if(arguments.length==9){f=arguments[1];h=arguments[2];j=arguments[3];m=arguments[4];b=arguments[5];c=arguments[6];d=arguments[7];e=arguments[8]}else throw Error("Invalid number of arguments");var o=p(this,b,c),n=[];n.push(" <g_vml_:group",' coordsize="',l*10,",",l*10,'"',' coordorigin="0,0"',' style="width:',10,"px;height:",10,"px;position:absolute;");if(this.m_[0][0]!=1||this.m_[0][1]||this.m_[1][1]!=1||this.m_[1][0]){var s=[];s.push("M11=",this.m_[0][0],
",","M12=",this.m_[1][0],",","M21=",this.m_[0][1],",","M22=",this.m_[1][1],",","Dx=",i(o.x/l),",","Dy=",i(o.y/l),"");var y=p(this,b+d,c),A=p(this,b,c+e);b=p(this,b+d,c+e);o.x=r.max(o.x,y.x,A.x,b.x);o.y=r.max(o.y,y.y,A.y,b.y);n.push("padding:0 ",i(o.x/l),"px ",i(o.y/l),"px 0;filter:progid:DXImageTransform.Microsoft.Matrix(",s.join(""),", sizingmethod='clip');")}else n.push("top:",i(o.y/l),"px;left:",i(o.x/l),"px;");n.push(' ">','<g_vml_:image src="',a.src,'"',' style="width:',l*d,"px;"," height:",
l*e,'px"',' cropleft="',f/k,'"',' croptop="',h/q,'"',' cropright="',(k-f-j)/k,'"',' cropbottom="',(q-h-m)/q,'"'," />","</g_vml_:group>");this.element_.insertAdjacentHTML("BeforeEnd",n.join(""))};g.stroke=function(a){var b=[];b.push("<g_vml_:shape",' filled="',!!a,'"',' style="position:absolute;width:',10,"px;height:",10,'px;"',' coordorigin="0,0"',' coordsize="',l*10,",",l*10,'"',' stroked="',!a,'"',' path="');for(var c={x:null,y:null},d={x:null,y:null},e=0;e<this.currentPath_.length;e++){var f=this.currentPath_[e];
switch(f.type){case "moveTo":b.push(" m ",i(f.x),",",i(f.y));break;case "lineTo":b.push(" l ",i(f.x),",",i(f.y));break;case "close":b.push(" x ");f=null;break;case "bezierCurveTo":b.push(" c ",i(f.cp1x),",",i(f.cp1y),",",i(f.cp2x),",",i(f.cp2y),",",i(f.x),",",i(f.y));break;case "at":case "wa":b.push(" ",f.type," ",i(f.x-this.arcScaleX_*f.radius),",",i(f.y-this.arcScaleY_*f.radius)," ",i(f.x+this.arcScaleX_*f.radius),",",i(f.y+this.arcScaleY_*f.radius)," ",i(f.xStart),",",i(f.yStart)," ",i(f.xEnd),
",",i(f.yEnd));break}if(f){if(c.x==null||f.x<c.x)c.x=f.x;if(d.x==null||f.x>d.x)d.x=f.x;if(c.y==null||f.y<c.y)c.y=f.y;if(d.y==null||f.y>d.y)d.y=f.y}}b.push(' ">');a?X(this,b,c,d):W(this,b);b.push("</g_vml_:shape>");this.element_.insertAdjacentHTML("beforeEnd",b.join(""))};g.fill=function(){this.stroke(true)};g.closePath=function(){this.currentPath_.push({type:"close"})};g.save=function(){var a={};T(this,a);this.aStack_.push(a);this.mStack_.push(this.m_);this.m_=u(D(),this.m_)};g.restore=function(){if(this.aStack_.length){T(this.aStack_.pop(),
this);this.m_=this.mStack_.pop()}};g.translate=function(a,b){z(this,u([[1,0,0],[0,1,0],[a,b,1]],this.m_),false)};g.rotate=function(a){var b=O(a);a=N(a);z(this,u([[b,a,0],[-a,b,0],[0,0,1]],this.m_),false)};g.scale=function(a,b){this.arcScaleX_*=a;this.arcScaleY_*=b;z(this,u([[a,0,0],[0,b,0],[0,0,1]],this.m_),true)};g.transform=function(a,b,c,d,e,f){z(this,u([[a,b,0],[c,d,0],[e,f,1]],this.m_),true)};g.setTransform=function(a,b,c,d,e,f){z(this,[[a,b,0],[c,d,0],[e,f,1]],true)};g.drawText_=function(a,
b,c,d,e){var f=this.m_;d=0;var h=1E3,j={x:0,y:0},m=[],k=fa(ea(this.font),this.element_),q=ga(k),o=this.element_.currentStyle,n=this.textAlign.toLowerCase();switch(n){case "left":case "center":case "right":break;case "end":n=o.direction=="ltr"?"right":"left";break;case "start":n=o.direction=="rtl"?"right":"left";break;default:n="left"}switch(this.textBaseline){case "hanging":case "top":j.y=k.size/1.75;break;case "middle":break;default:case null:case "alphabetic":case "ideographic":case "bottom":j.y=
-k.size/2.25;break}switch(n){case "right":d=1E3;h=0.05;break;case "center":d=h=500;break}b=p(this,b+j.x,c+j.y);m.push('<g_vml_:line from="',-d,' 0" to="',h,' 0.05" ',' coordsize="100 100" coordorigin="0 0"',' filled="',!e,'" stroked="',!!e,'" style="position:absolute;width:1px;height:1px;">');e?W(this,m):X(this,m,{x:-d,y:0},{x:h,y:k.size});e=f[0][0].toFixed(3)+","+f[1][0].toFixed(3)+","+f[0][1].toFixed(3)+","+f[1][1].toFixed(3)+",0,0";b=i(b.x/l)+","+i(b.y/l);m.push('<g_vml_:skew on="t" matrix="',
e,'" ',' offset="',b,'" origin="',d,' 0" />','<g_vml_:path textpathok="true" />','<g_vml_:textpath on="true" string="',Q(a),'" style="v-text-align:',n,";font:",Q(q),'" /></g_vml_:line>');this.element_.insertAdjacentHTML("beforeEnd",m.join(""))};g.fillText=function(a,b,c,d){this.drawText_(a,b,c,d,false)};g.strokeText=function(a,b,c,d){this.drawText_(a,b,c,d,true)};g.measureText=function(a){if(!this.textMeasureEl_){this.element_.insertAdjacentHTML("beforeEnd",'<span style="position:absolute;top:-20000px;left:0;padding:0;margin:0;border:none;white-space:pre;"></span>');
this.textMeasureEl_=this.element_.lastChild}var b=this.element_.ownerDocument;this.textMeasureEl_.innerHTML="";this.textMeasureEl_.style.font=this.font;this.textMeasureEl_.appendChild(b.createTextNode(a));return{width:this.textMeasureEl_.offsetWidth}};g.clip=function(){};g.arcTo=function(){};g.createPattern=function(a,b){return new K(a,b)};x.prototype.addColorStop=function(a,b){b=H(b);this.colors_.push({offset:a,color:b.color,alpha:b.alpha})};g=M.prototype=new Error;g.INDEX_SIZE_ERR=1;g.DOMSTRING_SIZE_ERR=
2;g.HIERARCHY_REQUEST_ERR=3;g.WRONG_DOCUMENT_ERR=4;g.INVALID_CHARACTER_ERR=5;g.NO_DATA_ALLOWED_ERR=6;g.NO_MODIFICATION_ALLOWED_ERR=7;g.NOT_FOUND_ERR=8;g.NOT_SUPPORTED_ERR=9;g.INUSE_ATTRIBUTE_ERR=10;g.INVALID_STATE_ERR=11;g.SYNTAX_ERR=12;g.INVALID_MODIFICATION_ERR=13;g.NAMESPACE_ERR=14;g.INVALID_ACCESS_ERR=15;g.VALIDATION_ERR=16;g.TYPE_MISMATCH_ERR=17;G_vmlCanvasManager=Y;CanvasRenderingContext2D=C;CanvasGradient=x;CanvasPattern=K;DOMException=M}();
