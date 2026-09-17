#include <cstdio>
#include <cmath>
#include <vector>
#include <string>
#include "Box2D/Box2D.h"
static constexpr float PPM=50.0f, DT=1.0f/60.0f;
static float px(float m){return m*PPM;} static float m(float p){return p/PPM;}

b2Body* makeBall(b2World& w,float x,float y,float vx=0,float vy=0){
  b2BodyDef bd; bd.type=b2_dynamicBody; bd.position.Set(m(x),m(y)); bd.linearVelocity.Set(m(vx),m(vy));
  b2Body* b=w.CreateBody(&bd); b2CircleShape s; s.m_radius=m(9); b2FixtureDef fd; fd.shape=&s; fd.density=1; fd.restitution=.3f; b->CreateFixture(&fd); return b;
}
b2Body* makeRect(b2World&w,float x,float y,float wid,float h,float rest=0,b2BodyType type=b2_staticBody){
 b2BodyDef bd; bd.type=type; bd.position.Set(m(x),m(y)); auto*b=w.CreateBody(&bd); b2PolygonShape s; s.SetAsBox(m(wid)*.5f,m(h)*.5f); b2FixtureDef fd;fd.shape=&s;fd.density=1;fd.restitution=rest;b->CreateFixture(&fd);return b;
}
b2Body* makeCircle(b2World&w,float x,float y,float r,float rest=0){
 b2BodyDef bd;bd.type=b2_staticBody;bd.position.Set(m(x),m(y));auto*b=w.CreateBody(&bd);b2CircleShape s;s.m_radius=m(r);b2FixtureDef fd;fd.shape=&s;fd.density=1;fd.restitution=rest;b->CreateFixture(&fd);return b;
}
void step(b2World&w){w.Step(DT,6,2);} 

void freefall(){b2World w({0,7});auto*b=makeBall(w,200,100);for(int i=0;i<60;i++)step(w); auto p=b->GetPosition(),v=b->GetLinearVelocity();printf("freefall y=%.6f vy=%.6f omega=%.6f\n",px(p.y),px(v.y),b->GetAngularVelocity());}
void wall(){b2World w({0,7});makeRect(w,200,400,400,10,0);auto*b=makeBall(w,200,350,150,300);float lastvy=px(b->GetLinearVelocity().y);for(int i=0;i<60;i++){step(w);float vy=px(b->GetLinearVelocity().y);if(lastvy>0&&vy<0){auto v=b->GetLinearVelocity(),p=b->GetPosition();printf("wall frame=%d x=%.6f y=%.6f vx=%.6f vy=%.6f omega=%.6f\n",i+1,px(p.x),px(p.y),px(v.x),px(v.y),b->GetAngularVelocity());return;}lastvy=vy;}printf("wall nohit\n");}
void bumper(){b2World w({0,7});makeCircle(w,200,300,10,.75f);auto*b=makeBall(w,170,250,180,300);float prevDist=1e9;for(int i=0;i<90;i++){step(w);auto p=b->GetPosition();float dx=px(p.x)-200,dy=px(p.y)-300,d=std::hypot(dx,dy);if(d>prevDist && prevDist<20.5){auto v=b->GetLinearVelocity();printf("bumper frame=%d x=%.6f y=%.6f vx=%.6f vy=%.6f omega=%.6f dist=%.6f\n",i+1,px(p.x),px(p.y),px(v.x),px(v.y),b->GetAngularVelocity(),d);return;}prevDist=d;}printf("bumper nohit dist=%.3f\n",prevDist);}
void superBounce(float rest,const char*name){b2World w({0,7});makeRect(w,200,400,400,10,rest);auto*b=makeBall(w,200,350,0,300);float last=px(b->GetLinearVelocity().y);for(int i=0;i<60;i++){step(w);float vy=px(b->GetLinearVelocity().y);if(last>0&&vy<0){printf("%s frame=%d vy=%.6f\n",name,i+1,vy);return;}last=vy;}}

struct Flip {b2Body* body; b2RevoluteJoint* joint;};
Flip makeLeftFlip(b2World&w){
 b2BodyDef ad;ad.type=b2_staticBody;ad.position.Set(m(147),m(745));auto*a=w.CreateBody(&ad);b2CircleShape ac;ac.m_radius=m(9)*.5f;a->CreateFixture(&ac,0);
 b2BodyDef bd;bd.type=b2_dynamicBody;bd.position.Set(m(137),m(675));auto*b=w.CreateBody(&bd);
 int raw[16]={6,62,15,62,47,82,47,86,43,86,5,77,1,71,1,66};b2Vec2 p[8];for(int i=0;i<8;i++)p[i].Set(m(raw[i*2]),m(raw[i*2+1]));b2PolygonShape sh;sh.Set(p,8);b2FixtureDef fd;fd.shape=&sh;fd.density=1;b->CreateFixture(&fd);
 b2RevoluteJointDef jd;jd.Initialize(a,b,a->GetWorldCenter());jd.collideConnected=false;jd.enableLimit=true;jd.lowerAngle=-45*M_PI/180.0;jd.upperAngle=0;jd.enableMotor=true;auto*j=(b2RevoluteJoint*)w.CreateJoint(&jd);return {b,j};
}
void flipperMotion(){b2World w({0,7});auto f=makeLeftFlip(w);float torque=0,speed=0;f.joint->SetMaxMotorTorque(0);f.joint->SetMotorSpeed(0);
 printf("flipper_motion");
 for(int frame=0;frame<30;frame++){
   step(w);
   // Scene update after physics: press frames 5..14, release frame15, idle otherwise
   if(frame==5){torque=25;speed=-25;f.joint->SetMaxMotorTorque(torque);f.joint->SetMotorSpeed(speed);} 
   else if(frame==15){torque=10;speed=25;f.joint->SetMaxMotorTorque(torque);f.joint->SetMotorSpeed(speed);} 
   else if(frame==16){f.joint->SetMaxMotorTorque(0);f.joint->SetMotorSpeed(0);} 
   printf(" %d:%.5f/%.5f",frame, f.joint->GetJointAngle()*180/M_PI, f.body->GetAngularVelocity());
 }
 printf("\n");
}
void flipperStrike(float bx,float by){b2World w({0,7});auto f=makeLeftFlip(w);auto*b=makeBall(w,bx,by,0,0);for(int frame=0;frame<25;frame++){
 step(w); if(frame==3){f.joint->SetMaxMotorTorque(25);f.joint->SetMotorSpeed(-25);} if(frame==13){f.joint->SetMaxMotorTorque(10);f.joint->SetMotorSpeed(25);} if(frame==14){f.joint->SetMaxMotorTorque(0);f.joint->SetMotorSpeed(0);} }
 auto p=b->GetPosition(),v=b->GetLinearVelocity(); printf("flipper_strike_%.0f_%.0f x=%.6f y=%.6f vx=%.6f vy=%.6f omega=%.6f\n",bx,by,px(p.x),px(p.y),px(v.x),px(v.y),b->GetAngularVelocity());
}
struct Kick {b2Body* body; b2PrismaticJoint* joint;};
Kick makeKicker(b2World&w){
 b2BodyDef ad;ad.type=b2_staticBody;ad.position.Set(m(412),m(801));auto*a=w.CreateBody(&ad);b2CircleShape ac;ac.m_radius=m(9)*.5;a->CreateFixture(&ac,0);
 auto*b=makeRect(w,412,801,6,34,0,b2_dynamicBody);
 b2PrismaticJointDef jd;jd.Initialize(a,b,a->GetWorldCenter(),b2Vec2(0,1));jd.enableLimit=true;jd.lowerTranslation=-.43f;jd.upperTranslation=1; jd.enableMotor=true;auto*j=(b2PrismaticJoint*)w.CreateJoint(&jd);return {b,j};
}

Flip makeRightFlip(b2World&w){
 b2BodyDef ad;ad.type=b2_staticBody;ad.position.Set(m(252),m(745));auto*a=w.CreateBody(&ad);b2CircleShape ac;ac.m_radius=m(9)*.5f;a->CreateFixture(&ac,0);
 b2BodyDef bd;bd.type=b2_dynamicBody;bd.position.Set(m(142),m(675));auto*b=w.CreateBody(&bd);
 int raw[16]={105,61,72,82,71,85,75,87,115,78,119,72,119,66,113,61};b2Vec2 p[8];for(int i=0;i<8;i++)p[i].Set(m(raw[i*2]),m(raw[i*2+1]));b2PolygonShape sh;sh.Set(p,8);b2FixtureDef fd;fd.shape=&sh;fd.density=1;b->CreateFixture(&fd);
 b2RevoluteJointDef jd;jd.Initialize(a,b,a->GetWorldCenter());jd.collideConnected=false;jd.enableLimit=true;jd.lowerAngle=0;jd.upperAngle=45*M_PI/180.0;jd.enableMotor=true;auto*j=(b2RevoluteJoint*)w.CreateJoint(&jd);return {b,j};
}
void rightFlipperMotion(){b2World w({0,7});auto f=makeRightFlip(w);f.joint->SetMaxMotorTorque(0);f.joint->SetMotorSpeed(0);printf("right_flipper_motion");for(int frame=0;frame<30;frame++){step(w);if(frame==5){f.joint->SetMaxMotorTorque(25);f.joint->SetMotorSpeed(25);}else if(frame==15){f.joint->SetMaxMotorTorque(10);f.joint->SetMotorSpeed(-25);}else if(frame==16){f.joint->SetMaxMotorTorque(0);f.joint->SetMotorSpeed(0);}printf(" %d:%.5f/%.5f",frame,f.joint->GetJointAngle()*180/M_PI,f.body->GetAngularVelocity());}printf("\n");}

void kickerMotion(){b2World w({0,7});auto k=makeKicker(w);printf("kicker_motion");
 // Application style: physics first, then input scene update. idle 30, press 30, release1, idle 30
 for(int frame=0;frame<91;frame++){
   step(w);
   if(frame<30 || frame>=61){k.joint->SetMaxMotorForce(k.body->GetPosition().y+5);k.joint->SetMotorSpeed(-15);} // idle
   else if(frame==30){k.joint->SetMaxMotorForce(-1);} // key down, speed persists
   else if(frame==60){/* KEY_UP: no motor changes */}
   auto p=k.body->GetPosition();auto v=k.body->GetLinearVelocity();
   if(frame%5==0||frame==29||frame==30||frame==31||frame==59||frame==60||frame==61||frame==62||frame==90)printf(" %d:%.4f/%.4f",frame,px(p.y),px(v.y));
 }
 printf("\n");
}
void launcherBall(){b2World w({0,7});auto k=makeKicker(w); // lane approximated from original walls
 makeRect(w,397,710,4,220,0); makeRect(w,426,710,4,220,0);
 auto*b=makeBall(w,412,700,0,0);float minY=700,minVy=0;
 for(int frame=0;frame<180;frame++){
   step(w);
   if(frame<50 || frame>=91){k.joint->SetMaxMotorForce(k.body->GetPosition().y+5);k.joint->SetMotorSpeed(-15);} else if(frame==50){k.joint->SetMaxMotorForce(-1);} // hold 40
   auto p=b->GetPosition();auto v=b->GetLinearVelocity();minY=std::min(minY,px(p.y));minVy=std::min(minVy,px(v.y));
   if(frame==90){/*keyup*/}
 }
 auto p=b->GetPosition(),v=b->GetLinearVelocity();printf("launcher_ball endY=%.6f vy=%.6f minY=%.6f minVy=%.6f\n",px(p.y),px(v.y),minY,minVy);
}
int main(){freefall();wall();bumper();superBounce(1.75,"bigbounce");superBounce(4,"kickerbounce");flipperMotion();rightFlipperMotion();flipperStrike(175,725);flipperStrike(190,725);flipperStrike(205,725);kickerMotion();launcherBall();}
