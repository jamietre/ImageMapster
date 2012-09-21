**Building ImageMapster from Source**

A rakefile is included as a standardized way to build the project. It should work for all environments and will build and minify the output. You need to have Ruby installed as well as uglifier (UglifyJS) gem. To install uglifier just do this (assuming Ruby exists):

<code>\> gem install uglifier</code>

To build:

<code>\> rake</code>

There used to be a couple batch files for building this with nonstandard tools. Since Uglifier now works on windows, they're deprecated, and rake is the right way to build this.

