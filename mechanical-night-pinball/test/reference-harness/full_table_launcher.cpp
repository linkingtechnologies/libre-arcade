#include <cstdio>
#include <algorithm>
#include <vector>
#include "Box2D/Box2D.h"
#include "ChainCoordinates.h"
static constexpr float PPM=50,DT=1.0f/60; static float m(float p){return p/PPM;} static float px(float x){return x*PPM;}
b2Body* chain(b2World&w,int* pts,int size){b2BodyDef bd;bd.type=b2_staticBody;auto*b=w.CreateBody(&bd);int n=size/2;std::vector<b2Vec2> p(n);for(int i=0;i<n;i++)p[i].Set(m(pts[2*i]),m(pts[2*i+1]));b2ChainShape s;s.CreateLoop(p.data(),n);b->CreateFixture(&s,0);return b;}
b2Body* ball(b2World&w){b2BodyDef bd;bd.type=b2_dynamicBody;bd.position.Set(m(412),m(700));auto*b=w.CreateBody(&bd);b2CircleShape s;s.m_radius=m(9);b2FixtureDef f;f.shape=&s;f.density=1;f.restitution=.3;b->CreateFixture(&f);return b;}
int main(){b2World w({0,7});wall_coordinates wc;chain(w,wc.outsideWalls,231);chain(w,wc.topLeftWalls,32);chain(w,wc.downLeftWalls,18);chain(w,wc.downRightWalls,18);
 b2BodyDef ad;ad.type=b2_staticBody;ad.position.Set(m(412),m(801));auto*a=w.CreateBody(&ad);b2CircleShape ac;ac.m_radius=m(4.5);a->CreateFixture(&ac,0);b2BodyDef bd;bd.type=b2_dynamicBody;bd.position.Set(m(412),m(801));auto*k=w.CreateBody(&bd);b2PolygonShape box;box.SetAsBox(m(3),m(17));b2FixtureDef kf;kf.shape=&box;kf.density=1;k->CreateFixture(&kf);b2PrismaticJointDef jd;jd.Initialize(a,k,a->GetWorldCenter(),{0,1});jd.enableLimit=true;jd.lowerTranslation=-.43;jd.upperTranslation=1;jd.enableMotor=true;auto*j=(b2PrismaticJoint*)w.CreateJoint(&jd);auto*b=ball(w);float minvy=0,miny=1e9,maxy=-1e9;
 for(int frame=0;frame<180;frame++){w.Step(DT,6,2);if(frame<50||frame>=91){j->SetMaxMotorForce(k->GetPosition().y+5);j->SetMotorSpeed(-15);}else if(frame==50)j->SetMaxMotorForce(-1);auto p=b->GetPosition(),v=b->GetLinearVelocity();minvy=std::min(minvy,px(v.y));miny=std::min(miny,px(p.y));maxy=std::max(maxy,px(p.y));if(frame==49||frame==50||frame==89||frame==90||frame==91||frame==100||frame==120||frame==150||frame==179)printf("%d %.3f %.3f %.3f %.3f ky %.3f %.3f\n",frame,px(p.x),px(p.y),px(v.x),px(v.y),px(k->GetPosition().y),px(k->GetLinearVelocity().y));}
printf("peak minvy=%.6f miny=%.6f maxy=%.6f\n",minvy,miny,maxy);}
