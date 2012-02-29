The rakefile is included as a standardized way to build the project. It should work for all users and will build
and minify the output. You need to have Ruby installed as well as uglifier and gzip:

> gem install uglifier
> gem install gzip


Also included is a simple batch file that will peform much the same process under windows and minify with 
Sharplinter (my own command line tool for validating & minifying javascript). See 
http://www.github.com/jamietre/sharplinter 

Finally, a third method, make2.bat, is the one I actually use myself. This uses something called sharpbatcher 
which basically does the same thing as "copy" but solves problems related to text encoding. Maybe it will do more
one day. I include this for my own convenience, and I have not put "sharpbatcher" on github yet, so feel free to 
ignore it. This also does some other minor processing to clean up the comments in the minimized output.

Any of these should work fine if you want to rebuild the script from the source files.
