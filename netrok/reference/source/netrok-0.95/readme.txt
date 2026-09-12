





				-=// netrok //=-
		
...free jump&run GPL SDL opensource game for windows and linux...



				ENGLISH README











-=// about Netrok //=-

Netrok is a GPL open source SDL game for linux and Windows. 
It`s a platform game like Super Mario, but it is not a clone. It has 
a new, fast and unique gameplay with some puzzle passages, where 
you have to think, how to proceed. In Netrok you jump on small buttons 
on the ground and upgrade your player and depending of this upgrade 
you have to destroy the enemies different, and you have to react fast. 
Also Netrok has a very complex score system and you get score for 
everything well done and you loose score for actions, which makes 
gameplay easier. E.g. you can throw a level jump`in flag and if you 
die, you can replay level from the position of this flag, but it costs
1000 score to place the flag, and you have only once the possibility 
to throw it and you have to deliberate about where to place it, if you 
place it to early, you have to replay much more than if you place it 
later in the level, which is also risky, because you could die before. 




-=// running the game //=-

Netrok must not be installed in any way, just extract the game archive and
start the binary.

For the Linux edition of Netrok, you need the SDL libraries and the SDL-mixer
libraries.
If you have problems running the game under linux, try this:

If the game is display centered and with small resolution then add the 
following to your XF86Config:

Subsection "Display"
        Depth       8
        Modes       "320x200"
        ViewPort    0 0
EndSubsection

IMPORTANT:

If you get segmentation faults, it is, because you are running your 
Xserver with wrong color depth or resolution
See XFree86 Documentation.





-=// story //=-

watch the game intro ;-)





-=// controls //=-

see instructions.txt or instructions in the game menu.




-=// .... //=-

Netrok's sourcecode (SDL C++, GPL licence, ca. 5500 lines of code), 
the Netrok Leveleditor and the newest binaries for Windows and Linux 
can be downloaded at the project page:
http://www.itpsoft.de/main.html.php?seite=netrok

gameidea, design, programming, graphics:   Ioan-Tudor Parvulescu <ioan@itpsoft.de>
music/sound effects: public domain 


Have fun with Netrok!
