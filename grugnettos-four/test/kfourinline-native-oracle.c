#include <stdio.h>
#include <string.h>
#define W 7
#define H 6
typedef struct{int c[W][H],h[W];} State;typedef struct{int x[4],y[4];} Line;
static Line lines[69];static int nl;static long distv[6]={2200,600,300,75,20,0};static long stones[4][5]={{0,500,40000,200000,9999999},{0,500,8000,40000,9999999},{0,0,4000,25000,9999999},{0,0,2000,12500,9999999}};
static void init(void){int d[4][2]={{1,0},{0,1},{1,1},{1,-1}};for(int x=0;x<W;x++)for(int y=0;y<H;y++)for(int k=0;k<4;k++){Line l;int ok=1;for(int i=0;i<4;i++){l.x[i]=x+d[k][0]*i;l.y[i]=y+d[k][1]*i;if(l.x[i]<0||l.x[i]>=W||l.y[i]<0||l.y[i]>=H)ok=0;}if(ok)lines[nl++]=l;}}
static long eval(State*s,int current){long yellow=0,red=0;for(int n=0;n<nl;n++){int color=0,cntc=0,cnt=0,mixed=0;long value=0;for(int i=0;i<4;i++){int x=lines[n].x[i],y=lines[n].y[i],v=s->c[x][y];if(v){if(color&&color!=v){mixed=1;break;}color=v;cntc++;}else{int distance=y-s->h[x];cnt+=distance;value+=distv[distance];}}if(mixed)continue;if(cnt>3)cnt=3;if(color==1)red+=value+stones[cnt][cntc];else if(color==2)yellow+=value+stones[cnt][cntc];}return current==1?red-yellow:yellow-red;}
int main(int argc,char**argv){init();for(int a=1;a<argc;a++){State s={0};int turn=1;for(char*p=argv[a];*p;p++){int x=*p-'1';s.c[x][s.h[x]++]=turn;turn=3-turn;}printf("%ld %ld\n",eval(&s,1),eval(&s,2));}return 0;}
