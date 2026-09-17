#include <cstdio>
#include <cmath>
#include <vector>
#include <algorithm>
#include "Box2D/Box2D.h"
#include "ChainCoordinates.h"

static constexpr float PPM=50.0f, DT=1.0f/60.0f;
static float m(float p){return p/PPM;} static float px(float x){return x*PPM;}

b2Body* makeChain(b2World&w,int* pts,int rawSize,float restitution=0.0f){
  b2BodyDef bd; bd.type=b2_staticBody; auto*b=w.CreateBody(&bd);
  int n=rawSize/2; std::vector<b2Vec2> p(n); for(int i=0;i<n;i++)p[i].Set(m(pts[2*i]),m(pts[2*i+1]));
  b2ChainShape s; s.CreateChain(p.data(),n);
  b2FixtureDef fd; fd.shape=&s; fd.restitution=restitution; b->CreateFixture(&fd); return b;
}
b2Body* makeCircle(b2World&w,float x,float y,float radius,b2BodyType type=b2_dynamicBody,float restitution=.3f){
  b2BodyDef bd;bd.type=type;bd.position.Set(m(x),m(y));auto*b=w.CreateBody(&bd);
  b2CircleShape s;s.m_radius=m(radius);b2FixtureDef fd;fd.shape=&s;fd.density=1;fd.restitution=restitution;b->CreateFixture(&fd);return b;
}
struct Flip { b2Body* body; b2RevoluteJoint* joint; };
Flip makeFlip(b2World&w,bool left){
  const int pivotX=left?147:252, pivotY=745;
  auto*a=makeCircle(w,pivotX,pivotY,4.5f,b2_staticBody,0);
  b2BodyDef bd;bd.type=b2_dynamicBody;bd.position.Set(m(left?137:142),m(675));auto*b=w.CreateBody(&bd);
  flipper_coordinates fc; int* raw=left?fc.leftFlipper:fc.rightFlipper;
  b2Vec2 p[8];for(int i=0;i<8;i++)p[i].Set(m(raw[2*i]),m(raw[2*i+1]));
  b2PolygonShape sh;sh.Set(p,8);b2FixtureDef fd;fd.shape=&sh;fd.density=1;b->CreateFixture(&fd);
  b2RevoluteJointDef jd;jd.Initialize(a,b,a->GetWorldCenter());jd.collideConnected=false;jd.enableLimit=true;jd.lowerAngle=(left?-45:0)*M_PI/180.0f;jd.upperAngle=(left?0:45)*M_PI/180.0f;jd.enableMotor=true;
  auto*j=(b2RevoluteJoint*)w.CreateJoint(&jd); return {b,j};
}
void addLowerTable(b2World&w){
  wall_coordinates wc; bumper_coordinates bc;
  makeChain(w,wc.outsideWalls,231); makeChain(w,wc.downLeftWalls,18); makeChain(w,wc.downRightWalls,18);
  makeChain(w,wc.leftBumperHugger,28); makeChain(w,wc.rightBumperHugger,28);
  makeChain(w,bc.leftBumper,8,1.75f); makeChain(w,bc.rightBumper,8,1.75f);
  // three peg bodies are relevant in the lower field in the real table
  makeCircle(w,25,520,5,b2_staticBody,.75f); makeCircle(w,200,764,5,b2_staticBody,.75f); makeCircle(w,375,520,5,b2_staticBody,.75f);
}

struct Result{float minVy,maxSpeed,endX,endY,endVx,endVy;int hitFrame;};
Result run(bool left,float bx,float by,int pressFrame=3,int releaseFrame=4,bool fullTable=true){
  b2World w({0,7}); if(fullTable)addLowerTable(w); auto f=makeFlip(w,left); auto*b=makeCircle(w,bx,by,9,b2_dynamicBody,.3f);
  float minVy=1e9f,maxSpeed=0; int hit=-1;
  for(int frame=0;frame<18;frame++){
    w.Step(DT,6,2);
    auto v=b->GetLinearVelocity(); float vy=px(v.y), vx=px(v.x), sp=std::hypot(vx,vy);
    if(vy<minVy){minVy=vy;hit=frame;} maxSpeed=std::max(maxSpeed,sp);
    // Match C++ order: scene input updates after physics Step.
    if(frame==pressFrame){f.joint->SetMaxMotorTorque(25);f.joint->SetMotorSpeed(left?-25:25);}
    if(frame==releaseFrame){f.joint->SetMaxMotorTorque(10);f.joint->SetMotorSpeed(left?25:-25);}
    if(frame==releaseFrame+1){f.joint->SetMaxMotorTorque(0);f.joint->SetMotorSpeed(0);}
  }
  auto p=b->GetPosition(),v=b->GetLinearVelocity();return{minVy,maxSpeed,px(p.x),px(p.y),px(v.x),px(v.y),hit};
}
int main(){
  printf("mode side x y minVy maxSpeed hitFrame endX endY endVx endVy\n");
  const float lxs[]={155,165,175,185,195,205};
  const float rxs[]={223,233,243,253,263,273};
  const float ys[]={714,720,724,728,732};
  for(bool full: {false,true}){
    for(float y:ys){for(float x:lxs){auto r=run(true,x,y,3,4,full);printf("%s L %.0f %.0f %.4f %.4f %d %.4f %.4f %.4f %.4f\n",full?"full":"iso",x,y,r.minVy,r.maxSpeed,r.hitFrame,r.endX,r.endY,r.endVx,r.endVy);} }
    for(float y:ys){for(float x:rxs){auto r=run(false,x,y,3,4,full);printf("%s R %.0f %.0f %.4f %.4f %d %.4f %.4f %.4f %.4f\n",full?"full":"iso",x,y,r.minVy,r.maxSpeed,r.hitFrame,r.endX,r.endY,r.endVx,r.endVy);} }
  }
}
