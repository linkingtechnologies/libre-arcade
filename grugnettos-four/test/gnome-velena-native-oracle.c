#include <stdio.h>
#include <string.h>
#define W 7
#define H 6
typedef struct { int c[W][H], stack[W], turn; } State;
typedef struct { int x[4],y[4]; } Group;
static Group groups[69]; static int ng;
static void init_groups(void){int dirs[4][2]={{1,0},{0,1},{1,1},{1,-1}};for(int x=0;x<W;x++)for(int y=0;y<H;y++)for(int d=0;d<4;d++){Group g;int ok=1;for(int i=0;i<4;i++){g.x[i]=x+dirs[d][0]*i;g.y[i]=y+dirs[d][1]*i;if(g.x[i]<0||g.x[i]>=W||g.y[i]<0||g.y[i]>=H)ok=0;}if(ok)groups[ng++]=g;}}
static int odd(State*s,int n,int side){int empty=0,fill=0,px=0,py=0;for(int i=0;i<4;i++){int x=groups[n].x[i],y=groups[n].y[i],v=s->c[x][y];if(!v){empty++;px=x;py=y;}else if(v==side)fill++;}return empty==1&&fill==3&&!(py&1)&&s->stack[px]<py?px+8*py:-1;}
static int later(State*s,int n,int pos,int side){for(int i=n+1;i<ng;i++)if(odd(s,i,side)==pos)return 1;return 0;}
static int pentas(State*s,int x,int y,int side){return s->stack[x]<y&&s->stack[x+2]<y&&s->stack[x+4]<y&&s->c[x+1][y]==side&&s->c[x+3][y]==side;}
static int eval(State*s){int t1=s->turn,t2=3-t1,score=0;for(int n=0;n<ng;n++){int p1=0,p2=0;for(int i=0;i<4;i++){int v=s->c[groups[n].x[i]][groups[n].y[i]];p1+=v==t1;p2+=v==t2;}if(p1==4)return 16384;if(p2==4)return -16384;if(p1==3&&!p2){score+=100;int z=odd(s,n,t1);if(z!=-1)score+=later(s,n,z,t1)?(t1==1?750:500):(t1==1?200:150);}if(p2==3&&!p1){score-=100;int z=odd(s,n,t2);if(z!=-1)score-=later(s,n,z,t2)?(t1==2?750:500):(t1==2?200:150);}if(p1==2&&!p2)score+=10;if(p2==2&&!p1)score-=10;}for(int x=0;x<3;x++)for(int y=2;y<=4;y+=2)if(pentas(s,x,y,1))return score+(t1==1?800:-800);return score;}
int main(int argc,char**argv){init_groups();for(int a=1;a<argc;a++){State s={0};s.turn=1;for(char*p=argv[a];*p;p++){int x=*p-'1';s.c[x][s.stack[x]++]=s.turn;s.turn=3-s.turn;}printf("%d\n",eval(&s));}return 0;}
