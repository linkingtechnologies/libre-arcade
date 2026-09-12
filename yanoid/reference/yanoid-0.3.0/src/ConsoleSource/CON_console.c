/*  CON_console.c
 *  Written By: Garrett Banuk <mongoose@mongeese.org>
 *  This is free, just be sure to give me credit when using it
 *  in any of your programs.
 */


#include <stdio.h>
#include <string.h>
#include <malloc.h>
#include <stdarg.h>
#include "SDL/SDL.h"
#include "CON_console.h"
#include "DT_drawtext.h"

static char **ConsoleLines = NULL;
static char **CommandLines = NULL;
static int CommandScrollBack = 0;	/* How much the users scrolled back in the command lines */
static int StringLocation = 0;	/* Current character location in the current string */
static int TotalConsoleLines = 0;	/* Total number of lines in the console */
static int ConsoleScrollBack = 0;	/* How much the users scrolled back in the console */
static int TotalCommands = 0;	/* Number of commands in the Back Commands */
static int FontNumber;		/* This is the number of the font for the console */
static int Line_Buffer;		/* The number of lines in the console */
static int BackX, BackY;	/* Background images x and y coords */
static SDL_Surface *ConsoleSurface;	/* Surface for the console text */
static SDL_Surface *OutputScreen;	/* This is the screen to draw the console to */
static SDL_Surface *BackgroundImage = NULL;	/* Background image for the console */
static SDL_Surface *InputBackground;	/* Dirty rectangle to draw over behind the users background */
static int DispX, DispY;	/* The top left x and y coords of the console on the display screen */
static unsigned char consoleAlpha = SDL_ALPHA_OPAQUE;
static Uint32 LastBlinkTime = 0;
static int Blink = 0;

static void DrawCommandLine();

/* Takes keys from the keyboard and inputs them to the console */
void CON_ConsoleEvents(SDL_Event * event)
{
	SDL_Rect inputbackground;
	int movesize = 0;
	Uint32 tmp;

	if (event->type == SDL_KEYDOWN)
	{
		switch (event->key.keysym.sym)
		{
			case SDLK_PAGEUP:
				if (ConsoleScrollBack < TotalConsoleLines && ConsoleScrollBack < Line_Buffer && Line_Buffer - ConsoleSurface->h / DT_FontHeight(FontNumber) > ConsoleScrollBack + 1)
				{
					ConsoleScrollBack++;
					CON_UpdateConsole();
				}
				break;
			case SDLK_PAGEDOWN:
				if (ConsoleScrollBack > 0)
				{
					ConsoleScrollBack--;
					CON_UpdateConsole();
				}
				break;
			case SDLK_END:
				ConsoleScrollBack = 0;
				CON_UpdateConsole();
				break;
			case SDLK_UP:
				if (CommandScrollBack < TotalCommands)
				{
					/* move back a line in the command strings and copy the command to the current input string */
					CommandScrollBack++;
					memset(ConsoleLines[0], 0, CON_CHARS_PER_LINE);
					strcpy(ConsoleLines[0], CommandLines[CommandScrollBack]);
					StringLocation = strlen(CommandLines[CommandScrollBack]);
					CON_UpdateConsole();
				}
				break;
			case SDLK_DOWN:
			        if (CommandScrollBack > 0)
				{
					/* move forward a line in the command strings and copy the command to the current input string */
					CommandScrollBack--;
					memset(ConsoleLines[0], 0, CON_CHARS_PER_LINE);
					strcpy(ConsoleLines[0], CommandLines[CommandScrollBack]);
					StringLocation = strlen(ConsoleLines[CommandScrollBack]);
					CON_UpdateConsole();
				}
				break;
			case SDLK_LEFT:
			        if (StringLocation > 0) {
				  /* move the cursor to the left */
				  StringLocation--;
				  tmp = LastBlinkTime;
				  LastBlinkTime = 0x00000000;
				  Blink = 1;
				  DrawCommandLine();
				  Blink = 1;
				  LastBlinkTime = 0xFFFFFFFF;
				  DrawCommandLine();
				  LastBlinkTime = tmp;
				  //				  CON_UpdateConsole();
			        }
				break;
			case SDLK_RIGHT:
			        if (StringLocation < strlen(ConsoleLines[CommandScrollBack])) {
				  /* move the cursor to the right */
				  StringLocation++;
				  tmp = LastBlinkTime;
				  LastBlinkTime = 0x00000000;
				  Blink = 1;
				  DrawCommandLine();
				  Blink = 1;
				  LastBlinkTime = 0xFFFFFFFF;
				  DrawCommandLine();
				  LastBlinkTime = tmp;
			        }
				break;
			case SDLK_BACKSPACE:
				if (StringLocation > 0)
				{
				  strcpy(ConsoleLines[0] + StringLocation - 1,ConsoleLines[0] + StringLocation);
				  //					ConsoleLines[0][StringLocation - 1] = '\0';
					StringLocation--;
					inputbackground.x = 0;
					inputbackground.y = ConsoleSurface->h - DT_FontHeight(FontNumber);
					inputbackground.w = ConsoleSurface->w;
					inputbackground.h = DT_FontHeight(FontNumber);
					SDL_BlitSurface(InputBackground, NULL, ConsoleSurface, &inputbackground);
					//DrawCommandLine();

				}
				break;
			case SDLK_TAB:
				CON_TabCompletion(ConsoleLines[0], &StringLocation);
				break;
			case SDLK_RETURN:
				CON_NewLineCommand();
				/* copy the input into the past commands strings */
				strcpy(CommandLines[0], ConsoleLines[0]);
				strcpy(ConsoleLines[1], ConsoleLines[0]);
				CON_CommandExecute(ConsoleLines[0]);

				/* zero out the current string and get it ready for new input */
				memset(ConsoleLines[0], 0, CON_CHARS_PER_LINE);
				CommandScrollBack = -1;
				StringLocation = 0;
				CON_UpdateConsole();
				break;
			default:
				if (StringLocation < CON_CHARS_PER_LINE - 1 && event->key.keysym.unicode)
				{
				        movesize = strlen(ConsoleLines[0] + StringLocation);
				        if (movesize > 0) { 
					  memmove(ConsoleLines[0] + StringLocation + 1, 
						  ConsoleLines[0] + StringLocation, movesize);
					}
					ConsoleLines[0][StringLocation] = (char)event->key.keysym.unicode;
					StringLocation++;
					inputbackground.x = 0;
					inputbackground.y = ConsoleSurface->h - DT_FontHeight(FontNumber);
					inputbackground.w = ConsoleSurface->w;
					inputbackground.h = DT_FontHeight(FontNumber);
					SDL_BlitSurface(InputBackground, NULL, ConsoleSurface, &inputbackground);
					//DrawCommandLine();
				}
		}
	}
}

// CON_SetAlphaGL() -- sets the alpha channel of an SDL_Surface to the
// specified value.  Preconditions: the surface in question is RGBA.
// 0 <= a <= 255, where 0 is transparent and 255 is opaque.
void CON_SetAlphaGL(SDL_Surface * s, int alpha)
{
	Uint8 val;
	int x, y, w, h;
	Uint32 pixel;
	Uint8 r, g, b, a;
	SDL_PixelFormat *format;

	// debugging assertions -- these slow you down, but hey,
	// crashing sucks
	if (!s)
	{
		fprintf(stderr, "ERROR: NULL Surface passed to CON_SetAlphaGL\n");
		return;
	}

	// clamp alpha value to 0...255
	if (alpha < SDL_ALPHA_TRANSPARENT)
		val = SDL_ALPHA_TRANSPARENT;
	else if (alpha > SDL_ALPHA_OPAQUE)
		val = SDL_ALPHA_OPAQUE;
	else
		val = alpha;

	// loop over alpha channels of each pixel, setting them
	// appropriately.
	w = s->w;
	h = s->h;
	format = s->format;
	switch (format->BytesPerPixel)
	{
		case 2:
			{
				// 16-bit surfaces don't seem to support alpha channels.
				static char errorPrinted = 0;
				if (!errorPrinted)
				{
					errorPrinted = 1;
					fprintf(stderr, "ERROR: 16-bit SDL surfaces do not support alpha-blending under OpenGL.\n");
				}
				break;
			}
		case 4:
			{
				// we can do this very quickly in 32-bit mode.  24-bit is more
				// difficult.  And since 24-bit mode is reall the same as 32-bit,
				// so it usually ends up taking this route too.  Win!  Unroll loops
				// and use pointer arithmetic for extra speed.
				int numpixels = h * (w << 2);
				Uint8 *pix = (Uint8 *) (s->pixels);
				Uint8 * last = pix + numpixels;
				Uint8 * pixel;
				if (numpixels & 0x7 == 0)
					for (pixel = pix + 3; pixel < last; pixel += 32)
						*pixel = *(pixel + 4) = *(pixel + 8) = *(pixel + 12) = *(pixel + 16) = *(pixel + 20) = *(pixel + 24) = *(pixel + 28) = val;
				
				else
					for (pixel = pix + 3; pixel < last; pixel += 4)
						*pixel = val;
				break;
			}
		default:
			// we have no choice but to do this slowly.  <sigh>
			for (y = 0; y < h; ++y)
				for (x = 0; x < w; ++x)
				{
					char print = 0;
					/* Lock the surface for direct access to the pixels */
					if (SDL_MUSTLOCK(s))
					{
						if (SDL_LockSurface(s) < 0)
						{
							fprintf(stderr, "Can't lock surface: %s\n", SDL_GetError());
							return;
						}
					}
					pixel = DT_GetPixel(s, x, y);
					if (x == 0 && y == 0)
						print = 1;
					SDL_GetRGBA(pixel, format, &r, &g, &b, &a);
					//if (print) printf("colors (%x %x %x %x) -> ",r,g,b,a);
					pixel = SDL_MapRGBA(format, r, g, b, val);
					SDL_GetRGBA(pixel, format, &r, &g, &b, &a);
					//if (print) printf("(%x %x %x %x)\n", r,g,b,a);
					DT_PutPixel(s, x, y, pixel);
					/* unlock surface again */
					if (SDL_MUSTLOCK(s))
					{
						SDL_UnlockSurface(s);
					}
				}
			break;
	}
}


/* Updates the console buffer */
void CON_UpdateConsole()
{
	int loop;
	int Screenlines = ConsoleSurface->h / DT_FontHeight(FontNumber);
	SDL_Rect DestRect;
	BitFont *CurrentFont = DT_FontPointer(FontNumber);

	//SDL_FillRect(ConsoleSurface, NULL, 0); // OLD
	//SDL_FillRect( ConsoleSurface,NULL,SDL_MapRGB( ConsoleSurface->format,0,0,0 ) ); //NEW
	SDL_FillRect(ConsoleSurface, NULL, SDL_MapRGBA(ConsoleSurface->format, 0, 0, 0, consoleAlpha));	//NEWER

	if (OutputScreen->flags & SDL_OPENGLBLIT)
		SDL_SetAlpha(ConsoleSurface, 0, SDL_ALPHA_OPAQUE);
	//else
	//      SDL_SetAlpha(ConsoleSurface, SDL_SRCALPHA, SDL_ALPHA_OPAQUE);

	/* draw the background image if there is one */
	if (BackgroundImage)
	{
		DestRect.x = BackX;
		DestRect.y = BackY;
		DestRect.w = BackgroundImage->w;
		DestRect.h = BackgroundImage->h;
		SDL_BlitSurface(BackgroundImage, NULL, ConsoleSurface, &DestRect);
	}

	/* Draw the text from the back buffers, calculate in the scrollback from the user
	 * this is a normal SDL software-mode blit, so we need to temporarily set the ColorKey
	 * for the font, and then clear it when we're done.
	 */
	if ((OutputScreen->flags & SDL_OPENGLBLIT) && (OutputScreen->format->BytesPerPixel > 2))
	{
		Uint32 *pix = (Uint32 *) (CurrentFont->FontSurface->pixels);
		SDL_SetColorKey(CurrentFont->FontSurface, SDL_SRCCOLORKEY, *pix);
	}
	for (loop = 0; loop < Screenlines - 1 && loop < Line_Buffer - 1; loop++)
		DT_DrawText(ConsoleLines[Screenlines - loop + ConsoleScrollBack - 1], ConsoleSurface, FontNumber, CON_CHAR_BORDER, loop * DT_FontHeight(FontNumber));
	if (OutputScreen->flags & SDL_OPENGLBLIT)
	{
		SDL_SetColorKey(CurrentFont->FontSurface, 0, 0);
	}
}

/* Draws the console buffer to the screen */
void CON_DrawConsole()
{
	SDL_Rect DestRect;

	/* Update the command line since it has a blinking cursor */
	DrawCommandLine();

	/* before drawing, make sure the alpha channel of the console surface is set
	 * properly.  (sigh) I wish we didn't have to do this every frame...
	 */
	if (OutputScreen->flags & SDL_OPENGLBLIT)
		CON_SetAlphaGL(ConsoleSurface, consoleAlpha);

	/* Setup the rect the console is being blitted into based on the output screen */
	DestRect.x = DispX;
	DestRect.y = DispY;
	DestRect.w = ConsoleSurface->w;
	DestRect.h = ConsoleSurface->h;

	SDL_BlitSurface(ConsoleSurface, NULL, OutputScreen, &DestRect);

	SDL_UpdateRects(OutputScreen, 1, &DestRect);
}


/* Initializes the console */
int CON_ConsoleInit(const char *FontName, SDL_Surface * DisplayScreen, int lines, SDL_Rect rect)
{
	int loop;
	SDL_Surface *Temp;


	OutputScreen = DisplayScreen;

	/* make sure that the size of the console is valid */
	if (rect.w > OutputScreen->w || rect.w < DT_FontWidth(FontNumber) * 32)
		rect.w = OutputScreen->w;
	if (rect.h > OutputScreen->h || rect.h < DT_FontHeight(FontNumber))
		rect.h = OutputScreen->h;
	if (rect.x < 0 || rect.x > OutputScreen->w - rect.w)
		DispX = 0;
	else
		DispX = rect.x;
	if (rect.y < 0 || rect.y > OutputScreen->h - rect.h)
		DispY = 0;
	else
		DispY = rect.y;

	/* load the console surface */
	Temp = SDL_CreateRGBSurface(SDL_SWSURFACE, rect.w, rect.h, OutputScreen->format->BitsPerPixel, 0, 0, 0, 0);
	if (Temp == NULL)
	{
		printf("Error Console.c:CON_ConsoleInit()\n\tCouldn't create the ConsoleSurface\n");
		return 1;
	}
	ConsoleSurface = SDL_DisplayFormat(Temp);
	SDL_FreeSurface(Temp);
	//SDL_FillRect(ConsoleSurface, NULL, 0); // OLD
	SDL_FillRect(ConsoleSurface, NULL, SDL_MapRGBA(ConsoleSurface->format, 0, 0, 0, consoleAlpha));

	/* Load the consoles font */
	if (-1 == (FontNumber = DT_LoadFont(FontName, TRANS_FONT)))
	{
		printf("Could not load the font \"%s\" for the console!\n", FontName);
		return 1;
	}

	/* We would like to have a minumum # of lines to guarentee we don't create a memory error */
	if (rect.h / DT_FontHeight(FontNumber) > lines)
		Line_Buffer = rect.h / DT_FontHeight(FontNumber);
	else
		Line_Buffer = lines;


	ConsoleLines = (char **)malloc(sizeof(char *) * Line_Buffer);
	CommandLines = (char **)malloc(sizeof(char *) * Line_Buffer);
	for (loop = 0; loop <= Line_Buffer - 1; loop++)
	{
		ConsoleLines[loop] = (char *)calloc(CON_CHARS_PER_LINE, sizeof(char));
		CommandLines[loop] = (char *)calloc(CON_CHARS_PER_LINE, sizeof(char));
	}

	/* Load the dirty rectangle for user input */
	Temp = SDL_CreateRGBSurface(SDL_SWSURFACE, rect.w, DT_FontHeight(FontNumber), OutputScreen->format->BitsPerPixel, 0, 0, 0, 0);
	if (Temp == NULL)
	{
		printf("Error Console.c:CON_ConsoleInit()\n\tCouldn't create the input background\n");
		return 1;
	}
	InputBackground = SDL_DisplayFormat(Temp);
	SDL_FreeSurface(Temp);
	// SDL_FillRect(InputBackground, NULL, 0); // OLD
	SDL_FillRect(InputBackground, NULL, SDL_MapRGBA(ConsoleSurface->format, 0, 0, 0, consoleAlpha));

	CON_ConOut("Console initialised.");
	CON_ListCommands();

	return 0;
}

/* Frees all the memory loaded by the console */
void CON_Destroy()
{
	int i;


	CON_DestroyCommands();
	DT_DestroyDrawText();
	for (i = 0; i <= Line_Buffer - 1; i++)
	{
		free(ConsoleLines[i]);
		free(CommandLines[i]);
	}
	free(ConsoleLines);
	free(CommandLines);

	ConsoleLines = NULL;
	CommandLines = NULL;
}


/* Increments the console line */
void CON_NewLineConsole()
{
	int loop;
	char *temp = ConsoleLines[Line_Buffer - 1];

	for (loop = Line_Buffer - 1; loop > 1; loop--)
		ConsoleLines[loop] = ConsoleLines[loop - 1];

	ConsoleLines[1] = temp;

	memset(ConsoleLines[1], 0, CON_CHARS_PER_LINE);
	if (TotalConsoleLines < Line_Buffer - 1)
		TotalConsoleLines++;
}


/* Increments the command lines */
void CON_NewLineCommand()
{
	int loop;
	char *temp = CommandLines[Line_Buffer - 1];

	for (loop = Line_Buffer - 1; loop > 0; loop--)
		CommandLines[loop] = CommandLines[loop - 1];

	CommandLines[0] = temp;

	memset(CommandLines[0], 0, CON_CHARS_PER_LINE);
	if (TotalCommands < Line_Buffer - 1)
		TotalCommands++;
}


/* Draws the command line the user is typing in to the screen */
static void DrawCommandLine()
{
	SDL_Rect rect, rect2, curdest;
	char temp[CON_CHARS_PER_LINE];
	BitFont *CurrentFont = DT_FontPointer(FontNumber);


	/* Check if the blink period is over */
	if (SDL_GetTicks() > LastBlinkTime)
	{
		LastBlinkTime = SDL_GetTicks() + CON_BLINK_RATE;

		if (Blink)
		{
			Blink = 0;
			/* The line was being drawn before, now it must be blacked out. */
			rect.x = CON_CHAR_BORDER;
			//			rect.x = strlen(ConsoleLines[0]) * DT_FontWidth(FontNumber) + CON_CHAR_BORDER;
			rect.y = ConsoleSurface->h - DT_FontHeight(FontNumber);
			rect.w = (strlen(ConsoleLines[0]) + 1) * DT_FontWidth(FontNumber);
			//			rect.w = DT_FontWidth(FontNumber);
			rect.h = DT_FontHeight(FontNumber);
			SDL_FillRect(ConsoleSurface, &rect, SDL_MapRGBA(ConsoleSurface->format, 0, 0, 0, consoleAlpha));
			/* Now draw the background image if applicable */
			if (BackgroundImage)
			{
				rect2.x = strlen(ConsoleLines[0]) * DT_FontWidth(FontNumber) + CON_CHAR_BORDER;
				rect.x =  rect2.x - BackX;
				rect2.y = ConsoleSurface->h - DT_FontHeight(FontNumber);
				rect.y = rect2.y - BackY;
				rect2.w = rect.w = DT_FontWidth(FontNumber);
				rect2.h = rect.h = DT_FontHeight(FontNumber);
				SDL_BlitSurface(BackgroundImage, &rect, ConsoleSurface, &rect2);
			}
		}
		else
			Blink = 1;
	}

	/* If there is enough buffer space add a cursor if it's time to Blink '_' */
	/* once again we're drawing text, so in OpenGL context we need to temporarily set up
	 * software-mode transparency.
	 */
	if (OutputScreen->flags & SDL_OPENGLBLIT)
	{
		Uint32 *pix = (Uint32 *) (CurrentFont->FontSurface->pixels);
		SDL_SetColorKey(CurrentFont->FontSurface, SDL_SRCCOLORKEY, *pix);
	}
	if (Blink && strlen(ConsoleLines[0]) + 1 < CON_CHARS_PER_LINE)
	{
		strcpy(temp, ConsoleLines[0]);
		// temp[strlen(ConsoleLines[0])] = '_';
		//		temp[strlen(ConsoleLines[0]) + 1] = '\0';
		//		temp[strlen(ConsoleLines[0])] = '\0';
		curdest.x = DT_FontWidth(FontNumber) * StringLocation + CON_CHAR_BORDER;
		curdest.y = ConsoleSurface->h - DT_FontHeight(FontNumber);
		curdest.w = DT_FontWidth(FontNumber);
		curdest.h = DT_FontHeight(FontNumber);
		SDL_FillRect(ConsoleSurface, &curdest, 0xAAAAAAAA);
		DT_DrawText(temp, ConsoleSurface, FontNumber, CON_CHAR_BORDER, ConsoleSurface->h - DT_FontHeight(FontNumber));
	}
	else			/* Not time to blink or the strings too long, just draw it. */
	{
		DT_DrawText(ConsoleLines[0], ConsoleSurface, FontNumber, CON_CHAR_BORDER, ConsoleSurface->h - DT_FontHeight(FontNumber));
	}
	if (OutputScreen->flags & SDL_OPENGLBLIT)
	{
		SDL_SetColorKey(CurrentFont->FontSurface, 0, 0);
	}
}


/* Outputs text to the console (in game and stdout), up to 256 chars can be entered */
void CON_ConOut(const char *str, ...)
{
	va_list marker;
	char temp[256];


	va_start(marker, str);
	vsprintf(temp, str, marker);
	va_end(marker);

	if (ConsoleLines)
	{
		strncpy(ConsoleLines[1], temp, CON_CHARS_PER_LINE);
		ConsoleLines[1][CON_CHARS_PER_LINE - 1] = '\0';
		CON_NewLineConsole();
		CON_UpdateConsole();
	}

	/* And print to stdout */
	// printf("%s\n", temp);
}


/* Sets the alpha level of the console, 0 turns off alpha blending */
void CON_ConsoleAlpha(unsigned char alpha)
{
	/* store alpha as state! */
	consoleAlpha = alpha;

	/* Don't allow anything below 20 or else the console isn't visible */
	if ((OutputScreen->flags & SDL_OPENGLBLIT) == 0)
	{
		if (alpha > 20)
			SDL_SetAlpha(ConsoleSurface, SDL_SRCALPHA, alpha);
		else if (alpha == 0)
			SDL_SetAlpha(ConsoleSurface, 0, alpha);
	}
	CON_UpdateConsole();
}


/* Adds  background image to the console, x and y based on consoles x and y */
int CON_ConsoleBackground(const char *image, int x, int y)
{
	SDL_Surface *temp;
	SDL_Rect backgroundsrc, backgrounddest;


	if (image == NULL && BackgroundImage != NULL)
	{
		SDL_FreeSurface(BackgroundImage);
		BackgroundImage = NULL;
		//SDL_FillRect(InputBackground, NULL, 0); // OLD
		SDL_FillRect(InputBackground, NULL, SDL_MapRGBA(ConsoleSurface->format, 0, 0, 0, SDL_ALPHA_OPAQUE));
		return 0;
	}

	if (NULL == (temp = SDL_LoadBMP(image)))
	{
		CON_ConOut("Cannot load background %s.", image);
		return 1;
	}
	if (BackgroundImage != NULL)
		SDL_FreeSurface(BackgroundImage);

	BackgroundImage = SDL_DisplayFormat(temp);
	SDL_FreeSurface(temp);
	BackX = x;
	BackY = y;

	backgroundsrc.x = 0;
	backgroundsrc.y = ConsoleSurface->h - DT_FontHeight(FontNumber) - BackY;
	backgroundsrc.w = BackgroundImage->w;
	backgroundsrc.h = InputBackground->h;

	backgrounddest.x = BackX;
	backgrounddest.y = 0;
	backgrounddest.w = BackgroundImage->w;
	backgrounddest.h = DT_FontHeight(FontNumber);

	// SDL_FillRect(InputBackground, NULL, 0); // OLD
	SDL_FillRect(InputBackground, NULL, SDL_MapRGBA(ConsoleSurface->format, 0, 0, 0, SDL_ALPHA_OPAQUE));
	SDL_BlitSurface(BackgroundImage, &backgroundsrc, InputBackground, &backgrounddest);

	return 0;
}

/* takes a new x and y of the top left of the console window */
void CON_Position(int x, int y)
{
	if (x < 0 || x > OutputScreen->w - ConsoleSurface->w)
		DispX = 0;
	else
		DispX = x;

	if (y < 0 || y > OutputScreen->h - ConsoleSurface->h)
		DispY = 0;
	else
		DispY = y;
}

/* resizes the console, has to reset alot of stuff
 * returns 1 on error */
int CON_Resize(SDL_Rect rect)
{
	SDL_Surface *Temp;
	SDL_Rect backgroundsrc, backgrounddest;


	/* make sure that the size of the console is valid */
	if (rect.w > OutputScreen->w || rect.w < DT_FontWidth(FontNumber) * 32)
		rect.w = OutputScreen->w;
	if (rect.h > OutputScreen->h || rect.h < DT_FontHeight(FontNumber))
		rect.h = OutputScreen->h;
	if (rect.x < 0 || rect.x > OutputScreen->w - rect.w)
		DispX = 0;
	else
		DispX = rect.x;
	if (rect.y < 0 || rect.y > OutputScreen->h - rect.h)
		DispY = 0;
	else
		DispY = rect.y;

	/* load the console surface */
	SDL_FreeSurface(ConsoleSurface);
	Temp = SDL_CreateRGBSurface(SDL_SWSURFACE, rect.w, rect.h, OutputScreen->format->BitsPerPixel, 0, 0, 0, 0);
	if (Temp == NULL)
	{
		printf("Error Console.c:CON_Resize()\n\tCouldn't create the ConsoleSurface\n");
		return 1;
	}
	ConsoleSurface = SDL_DisplayFormat(Temp);
	SDL_FreeSurface(Temp);

	/* Load the dirty rectangle for user input */
	SDL_FreeSurface(InputBackground);
	Temp = SDL_CreateRGBSurface(SDL_SWSURFACE, rect.w, DT_FontHeight(FontNumber), OutputScreen->format->BitsPerPixel, 0, 0, 0, 0);
	if (Temp == NULL)
	{
		printf("Error Console.c:CON_Resize()\n\tCouldn't create the input background\n");
		return 1;
	}
	InputBackground = SDL_DisplayFormat(Temp);
	SDL_FreeSurface(Temp);

	/* Now reset some stuff dependent on the previous size */
	ConsoleScrollBack = 0;

	/* Reload the background image (for the input text area) in the console */
	if (BackgroundImage)
	{
		backgroundsrc.x = 0;
		backgroundsrc.y = ConsoleSurface->h - DT_FontHeight(FontNumber) - BackY;
		backgroundsrc.w = BackgroundImage->w;
		backgroundsrc.h = InputBackground->h;

		backgrounddest.x = BackX;
		backgrounddest.y = 0;
		backgrounddest.w = BackgroundImage->w;
		backgrounddest.h = DT_FontHeight(FontNumber);

		//SDL_FillRect(InputBackground, NULL, 0); // OLD
		SDL_FillRect(InputBackground, NULL, SDL_MapRGBA(ConsoleSurface->format, 0, 0, 0, SDL_ALPHA_OPAQUE));
		SDL_BlitSurface(BackgroundImage, &backgroundsrc, InputBackground, &backgrounddest);
	}

	return 0;
}
