#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cmath>
#include <unistd.h>

#include "galaxy.hpp"
#include "sound.hpp"
#include "graphics.hpp"
#include "oracle_trace.hpp"

SDL_Surface *MYSDLSCREEN=NULL;
Soundset *sound=NULL;

void verbose(std::string) {}

static void usage(const char *a){
    std::fprintf(stderr,"Usage: %s --root HighMoonDir [--startup-seed N] [--galaxy-seed N] [--objects N] [--mode laser|heavy|cluster|ai] [--ticks N] [--power N] [--angle-deg D] [--start X,Y] [--ai-factor N] [--settle]\n",a);
}
static void render_background(Star *stars,Shootingstar &ss){for(int i=0;i<MAXSTARS;i++)stars[i].draw();ss.draw();}

int main(int argc,char **argv){
    const char *root=NULL,*mode="laser"; int startup_seed=12345,galaxy_seed=54321,objects=6,ticks=700,power=70,ai_factor=3; double angle_deg=0,start_x=130,start_y=384; bool settle=false;
    for(int i=1;i<argc;i++){
        if(!std::strcmp(argv[i],"--root")&&i+1<argc)root=argv[++i];
        else if(!std::strcmp(argv[i],"--startup-seed")&&i+1<argc)startup_seed=std::atoi(argv[++i]);
        else if(!std::strcmp(argv[i],"--galaxy-seed")&&i+1<argc)galaxy_seed=std::atoi(argv[++i]);
        else if(!std::strcmp(argv[i],"--objects")&&i+1<argc)objects=std::atoi(argv[++i]);
        else if(!std::strcmp(argv[i],"--mode")&&i+1<argc)mode=argv[++i];
        else if(!std::strcmp(argv[i],"--ticks")&&i+1<argc)ticks=std::atoi(argv[++i]);
        else if(!std::strcmp(argv[i],"--power")&&i+1<argc)power=std::atoi(argv[++i]);
        else if(!std::strcmp(argv[i],"--angle-deg")&&i+1<argc)angle_deg=std::atof(argv[++i]);
        else if(!std::strcmp(argv[i],"--start")&&i+1<argc){if(std::sscanf(argv[++i],"%lf,%lf",&start_x,&start_y)!=2){usage(argv[0]);return 2;}}
        else if(!std::strcmp(argv[i],"--ai-factor")&&i+1<argc)ai_factor=std::atoi(argv[++i]);
        else if(!std::strcmp(argv[i],"--settle"))settle=true;
        else {usage(argv[0]);return 2;}
    }
    if(!root){usage(argv[0]);return 2;} if(chdir(root)!=0){perror(root);return 3;}

    MYSDLSCREEN=SDL_CreateRGBSurface(0,SCREENWIDTH,SCREENHEIGHT,32,0,0,0,0);
    if(!MYSDLSCREEN){std::fprintf(stderr,"fake screen allocation failed\n");return 4;}
    Soundset snd; sound=&snd;

    HM_SRAND(startup_seed);
    Star *stars=new Star[MAXSTARS];
    Goldrain *goldrain=new Goldrain[MAXGOLDRAIN]; // constructor RNG is part of original Playfield initialization
    (void)goldrain;
    Shootingstar shooting_star;
    Ufo *ufos[MAXPLAYER];
    for(int i=0;i<MAXPLAYER;i++)ufos[i]=new Ufo(SCREENWIDTH/2,SCREENHEIGHT/2);
    Galaxy galaxy(objects,galaxy_seed); galaxy.set_Ufos(ufos,MAXPLAYER);

    if(settle){
        int frames=0;
        while(galaxy.is_Imploding() && frames<1000){render_background(stars,shooting_star);galaxy.draw();frames++;}
        std::fprintf(stderr,"settled_frames=%d\n",frames);
    }

    if(!std::strcmp(mode,"ai")){
        ufos[0]->set_Computer(); ufos[1]->set_Human(); ufos[0]->activate(); ufos[1]->deactivate();
        bool fired=false;
        for(int t=0;t<ticks;t++){
            if(!fired) fired=ufos[0]->calculate_Computer_Move(&galaxy,ai_factor);
            bool finished=galaxy.animate();
            galaxy.has_Extra_collision();
            render_background(stars,shooting_star); galaxy.draw();
            if(fired && finished) break;
        }
    } else {
        double angle=angle_deg*PI/180.0;
        Vector_2 start(start_x,start_y,K); Vector_2 velocity(power*SHOOTPOWERFACTOR,angle,P);
        Shoot *shot=NULL;
        if(!std::strcmp(mode,"heavy")) shot=new Heavy();
        else if(!std::strcmp(mode,"cluster")) shot=new Cluster();
        else shot=new Laser();
        shot->activate(start,velocity); galaxy.set_Shoot(shot);
        for(int t=0;t<ticks;t++){
            bool finished=galaxy.animate();
            galaxy.has_Extra_collision();
            render_background(stars,shooting_star); galaxy.draw();
            if(finished) break;
        }
        delete shot;
    }

    for(int i=0;i<MAXPLAYER;i++)delete ufos[i];
    delete[] stars; delete[] goldrain;
    SDL_FreeSurface(MYSDLSCREEN); MYSDLSCREEN=NULL;
    return 0;
}
