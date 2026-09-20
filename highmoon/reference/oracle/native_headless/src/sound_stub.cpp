#include "sound.hpp"
Soundset::Sample Soundset::sounds[NUMBEROFCHANNELS];
bool Soundset::soundOn=true;
Soundset::Soundset():amount(0){}
Soundset::~Soundset(){}
void Soundset::toggle(){soundOn=!soundOn;}
void Soundset::play(SoundId){}
void Soundset::start(){}
void Soundset::end(){}
void Soundset::loadAudio(char*,int){}
void Soundset::mixAudio(void*,Uint8*,int){}
