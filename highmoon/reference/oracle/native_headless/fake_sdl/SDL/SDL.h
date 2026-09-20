#ifndef HM_FAKE_SDL_H
#define HM_FAKE_SDL_H
#include <stdint.h>
typedef uint8_t Uint8;
typedef uint16_t Uint16;
typedef uint32_t Uint32;
typedef int16_t Sint16;
struct SDL_Color { Uint8 r,g,b,unused; };
struct SDL_Palette { int ncolors; SDL_Color *colors; };
struct SDL_PixelFormat { Uint8 BytesPerPixel; SDL_Palette *palette; };
struct SDL_Surface { SDL_PixelFormat *format; void *pixels; int pitch; int w; int h; };
struct SDL_Rect { Sint16 x; Sint16 y; Uint16 w; Uint16 h; };
struct SDL_AudioSpec { int freq; Uint16 format; Uint8 channels; Uint16 samples; void (*callback)(void*,Uint8*,int); void *userdata; };
struct SDL_AudioCVT { int needed; double len_ratio; Uint8 *buf; int len; int len_cvt; };
#define SDL_BYTEORDER 1234
#define SDL_BIG_ENDIAN 4321
#define SDL_LIL_ENDIAN 1234
#define SDL_MIX_MAXVOLUME 128
#define SDL_HWSURFACE 0x00000001
#define SDL_RLEACCEL 0x00004000
#define SDL_SRCCOLORKEY 0x00001000
#define SDL_SRCALPHA 0x00010000
#define SDLK_LEFT 276
#define SDLK_RIGHT 275
#define SDLK_UP 273
#define SDLK_DOWN 274
#define SDLK_SPACE 32
#define SDLK_ESCAPE 27
#define SDLK_TAB 9
#define SDLK_RETURN 13
#define SDLK_f 102
#define SDLK_F1 282
#define SDLK_F2 283
#define SDLK_F12 293
#define SDLK_c 99
#define SDLK_s 115
#define SDLK_h 104
#define SDLK_n 110
#ifdef __cplusplus
extern "C" {
#endif
int SDL_LockSurface(SDL_Surface*);
void SDL_UnlockSurface(SDL_Surface*);
Uint32 SDL_MapRGB(SDL_PixelFormat*, Uint8, Uint8, Uint8);
SDL_Surface *SDL_CreateRGBSurface(Uint32,int,int,int,Uint32,Uint32,Uint32,Uint32);
int SDL_SetColorKey(SDL_Surface*,Uint32,Uint32);
SDL_Surface *SDL_DisplayFormat(SDL_Surface*);
void SDL_FreeSurface(SDL_Surface*);
int SDL_SetAlpha(SDL_Surface*,Uint32,Uint8);
int SDL_BlitSurface(SDL_Surface*,SDL_Rect*,SDL_Surface*,SDL_Rect*);
const char *SDL_GetError(void);
#ifdef __cplusplus
}
#endif
#endif
