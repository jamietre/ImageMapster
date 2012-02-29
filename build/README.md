**Building ImageMapster from Source**

A rakefile is included as a standardized way to build the project. It should work for all users and will build and minify the output. You need to have Ruby installed as well as uglifier. To install uglifier just do this (assuming Ruby exists):

<code>\> gem install uglifier</code>

I'm not a Ruby person, so don't ask me any questions about it. I've only got ruby installed so I could test this rake file for those who may want to build this on OSes other than Windows.

**With Windows**

If you don't use Ruby, you can use <code>make.bat.</code> This requires SharpLinter, my own command-line javascript lint & compression tool. You can get that from http://www.github.com/jamietre/sharplinter 

If you run it without SharpLinter installed, it will still create a useable "jquery.imagemapster.js"-- it just won't also produce a minified version.

The other batch file, <code>make2.bat</code>, is what I use myself to build it before pushing out updates. It works more or less the same as <code>make.bat</code> but uses yet another custom tool instead of "copy" to avoid occasional text encoding issues. You don't have "SharpBatcher" so don't bother trying to use it, this is just in the repository for my own convenience.

Any of these should work fine if you want to rebuild the script from the source files, with minor variations of what comments will be included in the minified version. (SharpLinter includes only the first comment block; uglifier includes all comments before code begins).
