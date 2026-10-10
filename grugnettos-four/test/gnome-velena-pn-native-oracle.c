#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define INF 200000000
enum { AND_NODE=1, OR_NODE=2 }; static const int order[7]={3,2,4,5,1,0,6};
typedef struct Node { unsigned char b[7][6],turn,type; int move,proof,disproof; struct Node *parent,*child[7]; int children; } Node; static int made;
static int won(const unsigned char b[7][6],int p){for(int x=0;x<7;x++)for(int y=0;y<6;y++)if(b[x][y]==p){const int d[4][2]={{1,0},{0,1},{1,1},{1,-1}};for(int k=0;k<4;k++){int n;for(n=1;n<4;n++){int xx=x+d[k][0]*n,yy=y+d[k][1]*n;if(xx<0||xx>6||yy<0||yy>5||b[xx][yy]!=p)break;}if(n==4)return 1;}}return 0;}
static int legal_count(const unsigned char b[7][6]){int n=0;for(int x=0;x<7;x++)n+=b[x][0]==0;return n;}
static void evaluate(Node*n,int attacker){int moves=legal_count(n->b);if(won(n->b,attacker)){n->proof=0;n->disproof=INF;}else if(won(n->b,3-attacker)||!moves){n->proof=INF;n->disproof=0;}else if(n->type==OR_NODE){n->proof=1;n->disproof=moves;}else{n->proof=moves;n->disproof=1;}}
static void update(Node*n){if(!n->children)return;int p=n->type==OR_NODE?INF:0,d=n->type==OR_NODE?0:INF;for(int i=0;i<n->children;i++){Node*c=n->child[i];if(n->type==OR_NODE){if(c->proof<p)p=c->proof;d=d>INF-c->disproof?INF:d+c->disproof;}else{p=p>INF-c->proof?INF:p+c->proof;if(c->disproof<d)d=c->disproof;}}n->proof=p;n->disproof=d;if(!p)n->disproof=INF;else if(!d)n->proof=INF;}
static Node*new_node(const unsigned char b[7][6],int turn,int type,Node*parent,int move,int attacker){Node*n=calloc(1,sizeof *n);memcpy(n->b,b,42);n->turn=turn;n->type=type;n->parent=parent;n->move=move;evaluate(n,attacker);made++;return n;}
static Node*select_node(Node*n){while(n->children){int target=n->type==OR_NODE?n->proof:n->disproof,i;for(i=0;i<n->children;i++)if((n->type==OR_NODE?n->child[i]->proof:n->child[i]->disproof)==target)break;n=n->child[i];}return n;}
static void expand(Node*n,int attacker){for(int i=0;i<7;i++){int x=order[i];if(n->b[x][0])continue;unsigned char b[7][6];memcpy(b,n->b,42);for(int y=5;y>=0;y--)if(!b[x][y]){b[x][y]=n->turn;break;}n->child[n->children++]=new_node(b,3-n->turn,n->type==OR_NODE?AND_NODE:OR_NODE,n,x,attacker);}for(Node*p=n;p;p=p->parent)update(p);}
static void release(Node*n){for(int i=0;i<n->children;i++)release(n->child[i]);free(n);}
int main(int argc,char**argv){for(int a=1;a<argc;a++){unsigned char b[7][6]={0};int turn=1;for(char*s=argv[a];*s;s++){int x=*s-'1';for(int y=5;y>=0;y--)if(!b[x][y]){b[x][y]=turn;break;}turn=3-turn;}made=0;Node*r=new_node(b,turn,OR_NODE,0,-1,turn);while(r->proof&&r->disproof&&made<250)expand(select_node(r),turn);Node*best=0;for(int i=0;i<r->children;i++)if(!r->child[i]->proof){best=r->child[i];break;}if(!best)for(int o=0;o<7;o++)for(int i=0;i<r->children;i++)if(r->child[i]->move==order[o]&&(!best||r->child[i]->proof<best->proof||(r->child[i]->proof==best->proof&&r->child[i]->disproof>best->disproof)))best=r->child[i];printf("%d %d %d %d\n",best?best->move:-1,r->proof,r->disproof,made);release(r);}return 0;}
