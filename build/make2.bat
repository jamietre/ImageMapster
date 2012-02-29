rem copy src files first
sharpbatcher -v -c imagemapster-batch.conf
sharplinter -ph best *.min.js -f "..\dist\jquery.imagemapster.js"
pause