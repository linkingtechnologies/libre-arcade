#ifndef Drawtext_h
#define Drawtext_h


#define TRANS_FONT 1


typedef struct BitFont_td
{
	SDL_Surface			*FontSurface;
	int					CharWidth;
	int					CharHeight;
	int					FontNumber;
	struct BitFont_td	*NextFont;
} BitFont;

#ifdef __cplusplus
extern "C" {
#endif

Uint32 DT_GetPixel(SDL_Surface *surface, int x, int y);
void DT_PutPixel(SDL_Surface *surface, int x, int y, Uint32 pixel);
void DT_DrawText(const char *string, SDL_Surface *surface, int FontType, int x, int y );
int  DT_LoadFont(const char *BitmapName, int flags );
int  DT_FontHeight( int FontNumber );
int  DT_FontWidth( int FontNumber );
BitFont* DT_FontPointer(int FontNumber );
void DT_DestroyDrawText();


#ifdef __cplusplus
};
#endif

#endif
