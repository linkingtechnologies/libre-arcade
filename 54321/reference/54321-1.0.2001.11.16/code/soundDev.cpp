    #include <assert.h>
    #include <string.h>
    #include <math.h>
    #include <SDL.h>
    #include "soundDev.h"

    #ifndef M_PI
     #define M_PI 3.14159
    #endif
    NKlein_54321::SoundDev::SoundDev( void )
            : currentBuf( 0 ), currentPtr( 0 ), currentLen( 0 )
    {
            SDL_AudioSpec desired;

            desired.freq = FREQ;
            desired.format = AUDIO_S16SYS;
            desired.channels = 1;
            desired.samples = ( FREQ >> 6 );
            desired.callback = SoundDev::callbackTrampoline;
            desired.userdata = this;
            if ( ::SDL_OpenAudio( &desired, &this->spec ) < 0 ) {
                this->opened = false;
            } else {
                if ( this->spec.freq != FREQ
                || this->spec.format != AUDIO_S16SYS ) {
                    ::SDL_CloseAudio();
                    this->opened = false;
                } else {
                    this->opened = true;
                }
            }

        if ( this->opened ) {
                this->dingLen = 0;
                double volume = 0.0;
                Uint16* ptr = (Uint16*)&this->dingBuf[ 0 ];

                while ( this->dingLen < FREQ && volume < 8192.0 ) {
                        double angle = ( (double)this->dingLen / (double)FREQ * M_PI * 512.0 );
                        int ival = (int)( ::sin( angle ) * volume );

                            if ( ival >= 32767 ) {
                                ival = 32767;
                            } else if ( ival < -32768 ) {
                                ival = -32768;
                            }

                        unsigned short val = ( ival & 0x00FFFF );
                        *ptr++ = val;
                        this->dingLen += sizeof( Uint16 );
                    volume += 8192.0 * 64.0 / (double)FREQ;
                }

                while ( this->dingLen < FREQ && volume > 1.0 ) {
                        double angle = ( (double)this->dingLen / (double)FREQ * M_PI * 512.0 );
                        int ival = (int)( ::sin( angle ) * volume );

                            if ( ival >= 32767 ) {
                                ival = 32767;
                            } else if ( ival < -32768 ) {
                                ival = -32768;
                            }

                        unsigned short val = ( ival & 0x00FFFF );
                        *ptr++ = val;
                        this->dingLen += sizeof( Uint16 );
                    volume *= 0.90;
                }
        }
    }
        NKlein_54321::SoundDev::~SoundDev( void )
        {
            if ( this->opened ) {
                ::SDL_PauseAudio( 1 );
                ::SDL_CloseAudio();
            }

            delete[] this->currentBuf;
        }
        void
        NKlein_54321::SoundDev::play( Uint8* buffer, unsigned int len )
        {
            ::SDL_PauseAudio( 1 );

            delete[] this->currentBuf;

            this->currentBuf = new Uint8[ len ];
            ::memcpy( this->currentBuf, buffer, len );

            this->currentPtr = this->currentBuf;
            this->currentLen = len;

            ::SDL_PauseAudio( 0 );
        }
        void
        NKlein_54321::SoundDev::ding( void )
        {
            this->play( this->dingBuf, this->dingLen );
        }
        void
        NKlein_54321::SoundDev::callback( Uint8* stream, int len )
        {
            if ( this->currentLen > 0 ) {
                unsigned int copyLen = this->currentLen;

                if ( copyLen > len ) {
                    copyLen = len;
                }

                ::memcpy( stream, this->currentPtr, copyLen );
                this->currentPtr += copyLen;
                this->currentLen -= copyLen;

                stream += copyLen;
                len -= copyLen;
            } else {
                ::SDL_PauseAudio( 1 );
            }

            if ( len > 0 ) {
                ::memset( stream, 0, len );
            }
        }
        void
        NKlein_54321::SoundDev::callbackTrampoline(
                void* userData, Uint8* stream, int len
            )
        {
            assert( userData != 0 );
            SoundDev* dev = (SoundDev*)userData;
            dev->callback( stream, len );
        }
