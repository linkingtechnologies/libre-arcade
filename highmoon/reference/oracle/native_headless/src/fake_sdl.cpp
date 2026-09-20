#include <cstdio>
#include <cstdlib>
#include <cstring>
#include "SDL/SDL.h"
#include "SDL/SDL_image.h"

extern "C" {
int SDL_LockSurface(SDL_Surface*) { return 0; }
void SDL_UnlockSurface(SDL_Surface*) {}
Uint32 SDL_MapRGB(SDL_PixelFormat*, Uint8 r, Uint8 g, Uint8 b) { return ((Uint32)r<<16)|((Uint32)g<<8)|b; }
SDL_Surface *SDL_CreateRGBSurface(Uint32,int w,int h,int depth,Uint32,Uint32,Uint32,Uint32) {
    SDL_Surface *s=(SDL_Surface*)std::calloc(1,sizeof(SDL_Surface));
    s->format=(SDL_PixelFormat*)std::calloc(1,sizeof(SDL_PixelFormat));
    s->format->BytesPerPixel=(Uint8)(depth/8); if(!s->format->BytesPerPixel)s->format->BytesPerPixel=4;
    s->format->palette=(SDL_Palette*)std::calloc(1,sizeof(SDL_Palette));
    s->format->palette->ncolors=256;
    s->format->palette->colors=(SDL_Color*)std::calloc(256,sizeof(SDL_Color));
    s->w=w;s->h=h;s->pitch=w*s->format->BytesPerPixel;
    s->pixels=std::calloc((size_t)h,(size_t)s->pitch);
    return s;
}
int SDL_SetColorKey(SDL_Surface*,Uint32,Uint32){return 0;}
SDL_Surface *SDL_DisplayFormat(SDL_Surface *s){return s;}
void SDL_FreeSurface(SDL_Surface *s){if(!s)return;std::free(s->pixels);if(s->format){if(s->format->palette){std::free(s->format->palette->colors);std::free(s->format->palette);}std::free(s->format);}std::free(s);}
int SDL_SetAlpha(SDL_Surface*,Uint32,Uint8){return 0;}
int SDL_BlitSurface(SDL_Surface*,SDL_Rect*,SDL_Surface*,SDL_Rect*){return 0;}
const char *SDL_GetError(void){return "fake-sdl";}
SDL_Surface *IMG_Load(const char *filename){
    FILE *f=std::fopen(filename,"rb"); if(!f)return NULL; unsigned char h[10];
    if(std::fread(h,1,10,f)!=10){std::fclose(f);return NULL;} std::fclose(f);
    if(std::memcmp(h,"GIF87a",6)!=0 && std::memcmp(h,"GIF89a",6)!=0)return NULL;
    int w=(int)h[6]|((int)h[7]<<8), hh=(int)h[8]|((int)h[9]<<8);
    return SDL_CreateRGBSurface(0,w,hh,32,0,0,0,0);
}
}
