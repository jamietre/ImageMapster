cd ..
del dist\jquery.imagemapster.min.js
copy/b src\core.js+src\graphics.js+src\mapdata.js+src\areadata.js+src\areacorners.js+src\scale.js+src\tooltip.js dist\jquery.imagemapster.js
copy/b src\zepto.js+src\core.js+src\graphics.js+src\mapdata.js+src\areadata.js+src\areacorners.js+src\scale.js+src\tooltip.js dist\jquery.imagemapster.zepto.js
sharplinter -v -f dist\jquery.imagemapster.js  -v -ph best *.min.js 
sharplinter -v -f dist\jquery.imagemapster.zepto.js  -v -ph best *.min.js 
pause