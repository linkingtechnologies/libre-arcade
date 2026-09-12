#ifndef CON_console_H
#define CON_console_H


#include "CON_consolecommands.h"

#define CON_CHARS_PER_LINE   128
#define CON_BLINK_RATE       500
#define CON_CHAR_BORDER      4


#ifdef __cplusplus
extern "C"
{
#endif

	void CON_ConsoleEvents(SDL_Event * event);
	void CON_DrawConsole();
	int CON_ConsoleInit(const char *FontName, SDL_Surface * DisplayScreen, int lines, SDL_Rect rect);
	void CON_Destroy();
	void CON_ConOut(const char *str, ...);
	void CON_ConsoleAlpha(unsigned char alpha);
	int CON_ConsoleBackground(const char *image, int x, int y);
	void CON_Position(int x, int y);
	int CON_Resize(SDL_Rect rect);

	void CON_NewLineConsole();
	void CON_NewLineCommand();
	void CON_UpdateConsole();

#ifdef __cplusplus
};
#endif

#endif
