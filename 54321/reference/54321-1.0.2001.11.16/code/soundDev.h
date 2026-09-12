    namespace NKlein_54321 {
            class SoundDev {
                    public:
                            enum {
                                FREQ = 8192
                            };
                    public:
                            SoundDev( void );
                            ~SoundDev( void );
                    public:
                            inline bool isOpened( void ) const {
                                return this->opened;
                            };
                    protected:
                            void play( Uint8* buffer, unsigned int len );
                    public:
                            void ding( void );
                    private:
                            void callback( Uint8* stream, int len );
                            static void callbackTrampoline(
                                    void* userData, Uint8* stream, int len
                                );
                    private:
                            SDL_AudioSpec spec;
                            bool opened;
                            Uint8* currentBuf;
                            Uint8* currentPtr;
                            unsigned int currentLen;
                            Uint8 dingBuf[ FREQ ];
                            unsigned int dingLen;
            };
    };
