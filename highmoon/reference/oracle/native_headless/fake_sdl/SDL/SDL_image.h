#ifndef HM_FAKE_SDL_IMAGE_H
#define HM_FAKE_SDL_IMAGE_H
#include "SDL.h"
#ifdef __cplusplus
extern "C" {
#endif
SDL_Surface *IMG_Load(const char *filename);
#ifdef __cplusplus
}
#endif
#endif
