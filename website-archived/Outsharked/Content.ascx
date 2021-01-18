<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="Content.ascx.cs" Inherits="Outsharked.Content" %>
    <asp:Panel runat="server" ID="home" CssClass="content" Visible="false">
        <h2>Welcome to Outsharked.</h2>
        
        <div id="ie6" style="padding:10px; background: #EEEEEE; border: 1px solid black; display:none;margin-bottom:10px;" ><b>You are using Internet Explorer 6.</b> This site kinda works with IE6 but I haven't tried very hard. Think
        about upgrading your 10+ year old web browser that was never very good to begin with.</div>
        
        <p>This is the personal web site of Jamie Treworgy. I am a Washington, DC area software developer. Outsharked is the home
        for my open source projects and professional profile.
        </p>

        <h2>Image Mapster</h2>
         
        <p>
        Check out my first jQuery plugin, <a runat="server" href="/imagemapster">Image Mapster</a>. This came about because I wanted a simple way to 
        let people select many items from a list of U.S. states. Long multi-select lists are boring and take up too much space in a form, and are pain in the neck anyway.  
        So I figured if I'm going to open a modal dialog just to let people select some staes, it might as well be a nice experience. Since I loathe
        flash, which seems to be how most people do this, I came up with a way to add some nice flash-like menu features into an image map. 
        </p>
        <p>
        Turns out there aren't a lot of resources for using image maps this way. There are more menu and scrolling lightbox sort of plugins than you can shake a stick at, but 
        just a good old fashioned imagemap (with it's irregular area boundaries)? Not so much.
        </p><p>
        <b>Image Mapster</b> takes a plan old image map and brings it alive. Hover highlighting, select/deselect, bind selections to an external list of elements. 
        With almost no code you can turn any image map into a menu or an option list. Why use Flash when you can do the same thing in javascript? 
        </p>

    </asp:Panel>
    <asp:Panel runat="server" ID="about" CssClass="content"  Visible="false">
        <h2>About</h2>
        <p>I'm James Treworgy, a Washington, DC area software developer. My recent work has been web site development primarily using
        C#, (MVC and WebForms), Javascript, Jquery, and SQL Server. The focus of my recent work has been developing 
        web sites that use UI tools intelligently to create rich, interactive experiences involving complex data.
        </p>

        <p>In the past I've worked extensively in C++, SAS, some now-dead technologies, as well PHP, Perl, and MySql on Linux. For a 
        few years in the late 90's I ran a small-time web hosting service out of my attic... complete with automatic offsite backups.
        After a couple blackouts and a total server failure, I decided it wasn't fun anymore, and the dream died. But I learned
        a great many things about security, redundancy, and efficiency to get most out of my 768K SDSL pipe.
        </p>

        
        <h2>On Software Design</h2>

        <p>As a programmer, I am always trying to learn new technologies and techniques, and try something new. As a software designer, I try
        to incorporate solid (pun intended) design principles at every step. The real-world pressures of time and budget constraints
        always consipire to force one to make difficult choices: do I do it right now, or do I do it the quicker, dirtier way that
        solves the problem a little faster, but could come back to haunt me? </p>
        
        <p>The hard lesson that most software developers learn from experience is that it's when it's "dirty" it's rarely really
        "quick" in the long run. 
        It's a not often that you will write some code that is both useful and significant, and that you won't try to use it
        again, somewhere else. One of the most basic foundations of software design is DRY: <b>Don't Repeat Yourself.</b> 
        In reality, there's not much new under the sun, and after you've been at this for a few years, you realize that most of your time
        is spent solving problems essentially similar to ones that you (or someone else) has already solved.
        
        <p><b>Computer programmers are fundamentally trying to do less work.</b> It's funny, the best programmers are the ones
        who are the best at avoiding work. It's why most of us became fascinated with computers in the first place: 
        because we could give them some commands, and they would do something <i>for us</i>. As many times as we wanted. So for most people, the
        DRY principle is completely natural. Why write code that does something, if you've already written code to do that before?</p>
        
        <p>The hard part is doing this in a way that is manageable, reusable, and generalizable. It's easy to come up with a clever
        solution to a specific problem. It's harder to come up with a clever solution that works for lots of similar problems. But it's
        also vastly more useful, and ultimately more efficient than solving each similar problem again and again.</p>

        <p>This is the primary focus of my professional development. As much as I enjoy working with new technologies, it is the
        continual deepening of one's understanding of principles and patterns of design that make the creation of useful, durable software 
        possible.</p>
        
        </p>
    </asp:Panel>
    <asp:Panel runat="server" ID="more" CssClass="content"  Visible="false">
        <h2>Read my blog.</h2>

        <p>
        It's at <a href="http://blog.outsharked.com">blog.outsharked.com</a>. Clicking the shark logo goes there too. </p>
        <p>These days, it's not too often that google or <a href="http://www.stackoverflow.com">Stack Overflow</a> won't present you with a solution to most 
        programming problems. But it still happens, and I'm trying to help google be better at helping others when I figure something out that I couldn't using
        a search engine. That's what my blog is for, mostly.
        </p>

        <h2>What's Up With This Site</h2>
        <p>      
        Professional software developers always have crappy web sites. Web <i>designers</i> have nice looking ones.
        </p>
        <p>
        If I had more free time, I would probably still not choose to use it making my web site look better. Instead I use this as a playground to 
        experiment with some stuff. The menus use a neat jQuery plugin called <a href="http://razorjack.net/quicksand/">quicksand</a> that I wanted
        to try out. It actually does  much more interesting things than it does here. 
        </p>
        <p>The site itself loads all its normal content asynchronously in the simplest way imaginable. I thought this would be a cool 
        architecture. I quickly discovered the problems with such an architecture. If someone hits the back arrow, nothing happens.
        If someone hits reload, they always end up on the home page. It's hard to link to specific pages.</p>
        
        <p>I got around some of this stuff with a little trickery. It updates the browser location with the # thing you see
        to ensure that if you hit reload, you get back to the same page. Some of this stuff is disabled for some browsers, in which case, the links won't
        animate and the pages will just load old-school.</p>


    </asp:Panel>           
    <asp:Panel runat="server" ID="projects" CssClass="content"  Visible="false">
        <h2>JQuery Forms</h2>

        <p>It is with some conflict that I decided to write my own javascript form tool. This is almost certainly a case of falling victim to the
        <a href="http://c2.com/cgi/wiki?NotInventedHere">Not Invented Here</a> antipattern. That is, there are dozens if not more jQuery plugins out there
        that do exactly this sort of thing. In the universe of stuff that people have, almost certainly, already done hundreds of thousands of times before, writing
        a wrapper to manage form interaction and validation has got to have a position somewhere just below the throne occupied by printing "hello world." </p>

        <p>At the same time, as much as programmers can (and should) try to avoid reinventing the wheel, I couldn't find something that was not overly bloated,
        or convoluted, and flexible enough to be easily extended. I wanted a framework, one which I can extend easily with algorithms that hopefully someone else wrote, 
        not an out-of-the-box solution that tries to do everything and causes more problems than it solved. </p>
        
        <p>Besides, this is something I've done a half-dozen times in different server languages over two decades, so I figure I've got a pretty good handle on the basic
        architecture by this time. </p>

        <p>So here it is, my jQuery plugin to help you deal with forms: <a target="_blank" href="https://github.com/jamietre/jQuery-Form/wiki">JQuery-Form</a></p>

        <p>It's pretty simplistic, which is what I wanted, but gives you a nice programmatic interface to the elements of an input form and lets you do some basic things
        without thinking about it: read/write the data in the form, track and notify of dirty state, enable/disabled a form, and bind validators using HTML data. Writing new validators is a piece of cake.
        There aren't many now (two, to be exact) and I will add a few more simple ones (like numeric) as I need them, but the intent was never to make this a huge
        library but rather something that's a simple framework. And so it is now.</p>
        
        <h2>Image Mapster</h2>
        
        <p>Jquery Plugin to make image maps useful. Out of the box mouseover highlighting, selection and deselection, tool tips, and binding to an external list.</p>
        
       <a href="/imagemapster">ImageMapster Project Home</a> -- try it, download it, fork it.

       <p>...Now that you're using image maps for everything under the sun, you may find yourself needing to resize them. No problem! I thought of that too.</p>
       
       
       <h2>Image Map Resizer</h2>

       <p>It's not too hard to find imagemaps of almost every crazy thing you can imagine, like <a href="http://www.workingineuropeandasia.com/?u=1c6a6f942368d690c3cba37b7b0eef6a">much of europe</a>
       or <a href="http://faxmentis.org/html/science8.html">the moon</a>. It's great that people have gone to so much trouble to chart out the complex country
       boundary (or lunar crater) data, but you'll probably need to shrink it or enlarge it to suit your purposes.</p>

       Enter my <a href="http://blog.outsharked.com/p/quick-tricks.html">online Imagemap Resizer!</a> Faster than you can hit "Ctrl+C" and "Ctrl+V" you will have all
       the coordinate data recalculated to match any size you want.

       </asp:Panel>



       

       <asp:Panel runat="server" ID="imagemapster2" Visible="false">
               <h2>Image Mapster</h2>

               <p>A Jquery Plugin to make image maps useful.</p>

        <p><b><a href="/ImageMapster">See a demo online.</a></b> </p>

        
        <p><a href="https://github.com/jamietre/ImageMapster">ImageMapster github repository </a> - download or fork it</p>

        <p>Compatible with IE 6-9, FF 2-4, Safari 3+, Chrome 10, Opera 9-10</p>

        <p><b>Comments or questions? </b> Please leave them
         <a href="http://blog.outsharked.com/2011/04/imagemapster-jquery-plugin-for.html">on my blog post about ImageMapster</a> or at github.</p>

        <p>This was derived from code originally written by David Lynch for his plugin <a href="http://davidlynch.org/js/maphilight/docs/">Maphilight.</a> When I was looking
        for something to solve my problem, this was about the only thing out there that I could find to provide useful image map functionality. But while David's
        clever plugin has some great features, it was missing some things that I needed, specifically the ability to use an image map like a menu, so areas
        could be selected and deselected.
        </p>
        <p>A couple days later I'd gotten that working, but then I wanted more. I was tying my map of the United States to a checklist to provide an easier
        way for users to see everything that had or had not been selected. The code to link the map selections to a list selection was soon generalized as
        part of the plugin.</p>
        <p>I also fixed some cross-browser problems, made it work in IE9, and added some more features. So I think it's my own thing now, but the core rendering logic that
        renders selections from an image map was created by David Lynch.</p>

        I have not documented it's features completely but here is the quck rundown, and it's generally pretty easy to use. <i>This is new code.</i> I wrote it in the last two
        weeks. It seems stable, but I have not pushed it too much, so please <a href="mailto:jamie@outsharked.com">contact me</a> if you find any problems. 

        <p><b>Usage:</b></p>
        <pre class="myprettyprint">$('img').mapster(options);</pre>

        Bind to all selected images.
        <pre class="myprettyprint">$('area').mapster('select');
$('area').mapster('deselect');
$('area').mapster('set',selected);</pre>

        Select or deselect alements from jQuery objects wrapping "area" tags on the map based on truthiness of <i>selected</i>

        <pre class="myprettyprint">$('img').mapster('set',selected,'key');</pre>

        Select or deselect alements in the mapster bound to the image using a key (as identified with option <b>listKey</b>) 

        <p><a href="https://github.com/jamietre/ImageMapster">Please refer to Github for current download & documentation.</a></p>

        <asp:Panel runat="server" Visible="false">
        <p><b>Options</b></p>
        <p>Options can be assigned when creating a mapster. Some options can also be applied on a per-element basis (if it makes sense), e.g. alwaysOn, neverOn, selected. 
        To apply elements to an element, use jquery.data() to add an obkect to an area element, for example:</p>
        <pre class="myprettyprint">$('#some_area').data("mapster",{ selected: true; });</pre>

        <p><i>Some basic options inherited from maphilight:</i> These control animation on the mouseover highlight.</p>
        <pre class="myprettyprint">fill: true,
fillColor: '000000',
fillOpacity: 0.2,
stroke: true,
strokeColor: 'ff0000',
strokeOpacity: 1,
strokeWidth: 1,
fade: true,
wrapClass: false</pre>
<p>Please see the maplight web site for details for now. New options with default values:</p>
        <pre class="myprettyprint">isSelectable: false</pre>

        <p>Areas on the map can be selected/deselected by clicking.</p>
        
        <pre class="myprettyprint">alwaysOn: false
neverOn: false</pre>

        <p>Areas on the map are always on or always off (will not respond to mouseovers). Independent from isSelectable.</p>

        <pre class="myprettyprint">selected: false</pre>
        
        The area in question is selected. To set default selections when creating a new mapster, use $.data (see above) and this option.

        <pre class="myprettyprint">boundList: null</pre>

        A jquery object containing items to which the area data is bound.
        
        <pre class="myprettyprint">mapKey: 'title'</pre>

        An attribute on each area tag that identifies it. If there are duplicates, they are automatically considered part of the same group and will always be
        selected/deselcted together. If you don't want this functionality, ensure each key is unique.

        <pre class="myprettyprint">mapValue: 'alt'</pre>

        An attribute on each area tag that contains a string which is passed back to the calling code in the onGetList event (below).
        
        <pre class="myprettyprint">listKey: 'value'</pre>

        An attribute on the items in the boundList that is used to unquely identify it. These should correspond with the values in mapKey.

        <pre class="myprettyprint">listSelectedAttribute: ''</pre>

        When boundList is present, when a map area is selected, set or remove this attribute on the list element that matches that area based on their respective keys.
        
        <pre class="myprettyprint">listSelectedClass: 'selected'</pre>

        When boundList is present, when a map area is selected, set or remove this class.

       <pre class="myprettyprint">onClick: null</pre>

       A callback when an area is clicked of the following form:

       <pre class="myprettyprint" style="margin-left: 20px; margin-right:20px;background:#CADAEA">function clickHandler(data) {
    //this = area element clicked
    //data = {
        target: e.target,
        listTarget: matching $(item) from boundList
        areaTarget: matching $(area)
        areaOptions: options active for this area
        key: mapKey for this area
        selected: whether or not item is now selected 
    };
}</pre>

       This can be used to perform additional actions on a click without binding another event and having to obtain information manually.

       <pre class="myprettyprint">onGetList: null</pre>

       A callback when the mapster is first bound to an image, allows you to dynamically provide a boundList. The event passes an array of all the 
       unique keys and values found in the areas.
       The client should return a jQuery list of all the elements that make up the bound list (same as if it was assigned manually). Example usage:

        <pre class="myprettyprint" style="margin-left: 20px; margin-right:20px;background:#CADAEA">function getListHandler(data) {
    for (var i=0;i&lt;data.length;i++) {
        $element = ... // create an HTML element using data.key & data.value 
        $myListContainer.append($element);
    }
    // do not return the container - only the actual elements that make up the list
    return $myListContainer.children();
}</pre>


       <pre class="myprettyprint">sortList: false | "asc" | "desc"</pre>

       If the <a href="http://http://tinysort.sjeiti.com/">tinysort</a> jquery plugin is present, will sort the list ascending or descending before calling onGetList.

       
       </asp:Panel>
    </asp:Panel>