from pathlib import Path
root=Path('/mnt/data/highmoon_oracle_work/instrumented/HighMoon/src')

oracle_hpp = r'''#ifndef __ORACLE_TRACE_HPP__
#define __ORACLE_TRACE_HPP__

#include "vector_2.hpp"

int hm_oracle_rand(const char *file, int line);
void hm_oracle_srand(unsigned int seed, const char *file, int line);
void hm_oracle_step_begin(const Vector_2 &position, const Vector_2 &direction);
void hm_oracle_gravity_body(int index, double body_x, double body_y, double weight,
                            double distance, const Vector_2 &delta_v);
void hm_oracle_step_end(const Vector_2 &position, const Vector_2 &direction);
void hm_oracle_collision(const char *kind, int index,
                         double collider_x, double collider_y, double collider_width,
                         double shot_x, double shot_y, double shot_width);
void hm_oracle_shoot_path(const char *event, const Vector_2 &start, const Vector_2 &direction,
                          int steps=-1);
void hm_oracle_ai_candidate(int player_id, int factor, int searches_remaining,
                            double y, double power, double angle, bool found);
void hm_oracle_shot_activate(double x, double y, double speed, double direction, double weight);
void hm_oracle_wormhole(double from_x, double from_y, double to_x, double to_y,
                        double speed, double direction);
void hm_oracle_damage(double before, double after, double projectile_speed, double projectile_weight);
void hm_oracle_cluster_split(double x, double y, double speed, double direction);

#ifdef __ORACLE_TRACE__
#define HM_RAND() hm_oracle_rand(__FILE__, __LINE__)
#define HM_SRAND(seed) hm_oracle_srand((unsigned int)(seed), __FILE__, __LINE__)
#else
#include <cstdlib>
#define HM_RAND() rand()
#define HM_SRAND(seed) srand(seed)
#endif

#endif
'''
(root/'oracle_trace.hpp').write_text(oracle_hpp)

oracle_cpp = r'''#include "oracle_trace.hpp"

#include <cstdio>
#include <cstdlib>
#include <stdint.h>

namespace {
FILE *trace_file = NULL;
unsigned long long rng_index = 0;
unsigned long long step_index = 0;
unsigned long long active_step = 0;
bool trace_initialized = false;

FILE *out()
{
    if (!trace_initialized) {
        trace_initialized = true;
        const char *path = std::getenv("HIGHMOON_ORACLE_JSONL");
        if (path && *path)
            trace_file = std::fopen(path, "a");
    }
    return trace_file;
}

unsigned long long bits(double value)
{
    union { double d; uint64_t u; } v;
    v.d = value;
    return (unsigned long long)v.u;
}

void num(FILE *f, const char *name, double value)
{
    std::fprintf(f, "\\\"%s\\\":%.17g,\\\"%s_bits\\\":\\\"%016llx\\\"",
                 name, value, name, bits(value));
}

void vec(FILE *f, const char *name, const Vector_2 &value)
{
    Vector_2 v = value;
    std::fprintf(f, "\\\"%s\\\":{", name);
    num(f, "x", v.getX());
    std::fprintf(f, ",");
    num(f, "y", v.getY());
    std::fprintf(f, "}");
}
}

int hm_oracle_rand(const char *file, int line)
{
    int value = std::rand();
    FILE *f = out();
    if (f) {
        std::fprintf(f, "{\\\"event\\\":\\\"rng\\\",\\\"index\\\":%llu,\\\"raw\\\":%d,\\\"rand_max\\\":%d,\\\"file\\\":\\\"%s\\\",\\\"line\\\":%d}\\n",
                     rng_index, value, RAND_MAX, file, line);
        std::fflush(f);
    }
    ++rng_index;
    return value;
}

void hm_oracle_srand(unsigned int seed, const char *file, int line)
{
    std::srand(seed);
    FILE *f = out();
    if (f) {
        std::fprintf(f, "{\\\"event\\\":\\\"srand\\\",\\\"seed\\\":%u,\\\"rng_index\\\":%llu,\\\"file\\\":\\\"%s\\\",\\\"line\\\":%d}\\n",
                     seed, rng_index, file, line);
        std::fflush(f);
    }
}

void hm_oracle_step_begin(const Vector_2 &position, const Vector_2 &direction)
{
    FILE *f = out();
    active_step = step_index++;
    if (!f) return;
    std::fprintf(f, "{\\\"event\\\":\\\"step_begin\\\",\\\"step\\\":%llu,", active_step);
    vec(f, "position", position); std::fprintf(f, ",");
    vec(f, "velocity", direction); std::fprintf(f, "}\\n");
}

void hm_oracle_gravity_body(int index, double body_x, double body_y, double weight,
                            double distance, const Vector_2 &delta_v)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\\\"event\\\":\\\"gravity\\\",\\\"step\\\":%llu,\\\"body_index\\\":%d,", active_step, index);
    num(f, "body_x", body_x); std::fprintf(f, ",");
    num(f, "body_y", body_y); std::fprintf(f, ",");
    num(f, "weight", weight); std::fprintf(f, ",");
    num(f, "distance", distance); std::fprintf(f, ",");
    vec(f, "delta_v", delta_v); std::fprintf(f, "}\\n");
}

void hm_oracle_step_end(const Vector_2 &position, const Vector_2 &direction)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\\\"event\\\":\\\"step_end\\\",\\\"step\\\":%llu,", active_step);
    vec(f, "position", position); std::fprintf(f, ",");
    vec(f, "velocity", direction); std::fprintf(f, "}\\n");
}

void hm_oracle_collision(const char *kind, int index,
                         double collider_x, double collider_y, double collider_width,
                         double shot_x, double shot_y, double shot_width)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\\\"event\\\":\\\"collision\\\",\\\"kind\\\":\\\"%s\\\",\\\"index\\\":%d,", kind, index);
    num(f, "collider_x", collider_x); std::fprintf(f, ",");
    num(f, "collider_y", collider_y); std::fprintf(f, ",");
    num(f, "collider_width", collider_width); std::fprintf(f, ",");
    num(f, "shot_x", shot_x); std::fprintf(f, ",");
    num(f, "shot_y", shot_y); std::fprintf(f, ",");
    num(f, "shot_width", shot_width); std::fprintf(f, "}\\n");
}

void hm_oracle_shoot_path(const char *event, const Vector_2 &start, const Vector_2 &direction, int steps)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\\\"event\\\":\\\"%s\\\",", event);
    vec(f, "start", start); std::fprintf(f, ",");
    vec(f, "velocity", direction);
    if (steps >= 0) std::fprintf(f, ",\\\"steps\\\":%d", steps);
    std::fprintf(f, "}\\n");
}

void hm_oracle_ai_candidate(int player_id, int factor, int searches_remaining,
                            double y, double power, double angle, bool found)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\\\"event\\\":\\\"ai_candidate\\\",\\\"player\\\":%d,\\\"factor\\\":%d,\\\"searches_remaining\\\":%d,",
                 player_id, factor, searches_remaining);
    num(f, "y", y); std::fprintf(f, ",");
    num(f, "power", power); std::fprintf(f, ",");
    num(f, "angle", angle); std::fprintf(f, ",\\\"found\\\":%s}\\n", found ? "true" : "false");
}

void hm_oracle_shot_activate(double x, double y, double speed, double direction, double weight)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\\\"event\\\":\\\"shot_activate\\\",");
    num(f, "x", x); std::fprintf(f, ",");
    num(f, "y", y); std::fprintf(f, ",");
    num(f, "speed", speed); std::fprintf(f, ",");
    num(f, "direction", direction); std::fprintf(f, ",");
    num(f, "weight", weight); std::fprintf(f, "}\\n");
}

void hm_oracle_wormhole(double from_x, double from_y, double to_x, double to_y,
                        double speed, double direction)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\\\"event\\\":\\\"wormhole_teleport\\\",");
    num(f, "from_x", from_x); std::fprintf(f, ",");
    num(f, "from_y", from_y); std::fprintf(f, ",");
    num(f, "to_x", to_x); std::fprintf(f, ",");
    num(f, "to_y", to_y); std::fprintf(f, ",");
    num(f, "speed", speed); std::fprintf(f, ",");
    num(f, "direction", direction); std::fprintf(f, "}\\n");
}

void hm_oracle_damage(double before, double after, double projectile_speed, double projectile_weight)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\\\"event\\\":\\\"ufo_damage\\\",");
    num(f, "shield_before", before); std::fprintf(f, ",");
    num(f, "shield_after", after); std::fprintf(f, ",");
    num(f, "projectile_speed", projectile_speed); std::fprintf(f, ",");
    num(f, "projectile_weight", projectile_weight); std::fprintf(f, "}\\n");
}

void hm_oracle_cluster_split(double x, double y, double speed, double direction)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\\\"event\\\":\\\"cluster_split\\\",");
    num(f, "x", x); std::fprintf(f, ",");
    num(f, "y", y); std::fprintf(f, ",");
    num(f, "speed", speed); std::fprintf(f, ",");
    num(f, "direction", direction); std::fprintf(f, "}\\n");
}
'''
(root/'oracle_trace.cpp').write_text(oracle_cpp)

p=root/'constants.hpp'; s=p.read_text()
s=s.replace('#include <SDL/SDL.h>\n', '#include <SDL/SDL.h>\n#include "oracle_trace.hpp"\n')
s=s.replace('#define RANDOM(max,min) ((max-min)*(rand()/(RAND_MAX+1.0))+min)', '#define RANDOM(max,min) ((max-min)*(HM_RAND()/(RAND_MAX+1.0))+min)')
p.write_text(s)

p=root/'galaxy.cpp'; s=p.read_text()
s=s.replace('srand(id);', 'HM_SRAND(id);')
old = '''bool Galaxy::has_collision( Spaceobject *object )
{
	// Check all Objects
	for ( int i=0; i < objects_in_galaxy; i++ )
		if ( objects[i]->has_collision(object) ) 
			return true;

	// Check all Flying Saucers
	for ( int i=0; i < ufos_in_galaxy; i++ )
		if ( ufos[i]->has_collision(object) )
			return true;

	return false;
}
'''
new = '''bool Galaxy::has_collision( Spaceobject *object )
{
	// Check all Objects
	for ( int i=0; i < objects_in_galaxy; i++ )
		if ( objects[i]->has_collision(object) ) {
#ifdef __ORACLE_TRACE__
			hm_oracle_collision("galaxy_object", i, objects[i]->get_X(), objects[i]->get_Y(), objects[i]->get_Width(), object->get_X(), object->get_Y(), object->get_Width());
#endif
			return true;
		}

	// Check all Flying Saucers
	for ( int i=0; i < ufos_in_galaxy; i++ )
		if ( ufos[i]->has_collision(object) ) {
#ifdef __ORACLE_TRACE__
			hm_oracle_collision("ufo", i, ufos[i]->get_X(), ufos[i]->get_Y(), ufos[i]->get_Width(), object->get_X(), object->get_Y(), object->get_Width());
#endif
			return true;
		}

	return false;
}
'''
assert old in s, 'has_collision not found'
s=s.replace(old,new)
old = '''void Galaxy::calculate_nextPos( Vector_2 &position, Vector_2 &direction )
{
	Vector_2 vec_toPlanets = Vector_2( 0, 0, K );

	for ( int i=0; i < objects_in_galaxy; i++ ) {
		Vector_2 vec_PlanetPos = Vector_2( objects[i]->get_X(), objects[i]->get_Y(), K);
		double distance = vec_PlanetPos.distance(position);
		Vector_2 vec_toPlanet = vec_PlanetPos-position;
		vec_toPlanet = vec_toPlanet.newLength( objects[i]->get_Weight()/distance );
		vec_toPlanets = vec_toPlanets+vec_toPlanet;
	}
	direction += vec_toPlanets;

	position += direction.newLength( direction.getLength() * SHOOT_INTERVAL / 1000 );
}
'''
new = '''void Galaxy::calculate_nextPos( Vector_2 &position, Vector_2 &direction )
{
#ifdef __ORACLE_TRACE__
	hm_oracle_step_begin(position, direction);
#endif
	Vector_2 vec_toPlanets = Vector_2( 0, 0, K );

	for ( int i=0; i < objects_in_galaxy; i++ ) {
		Vector_2 vec_PlanetPos = Vector_2( objects[i]->get_X(), objects[i]->get_Y(), K);
		double distance = vec_PlanetPos.distance(position);
		Vector_2 vec_toPlanet = vec_PlanetPos-position;
		vec_toPlanet = vec_toPlanet.newLength( objects[i]->get_Weight()/distance );
#ifdef __ORACLE_TRACE__
		hm_oracle_gravity_body(i, objects[i]->get_X(), objects[i]->get_Y(), objects[i]->get_Weight(), distance, vec_toPlanet);
#endif
		vec_toPlanets = vec_toPlanets+vec_toPlanet;
	}
	direction += vec_toPlanets;

	position += direction.newLength( direction.getLength() * SHOOT_INTERVAL / 1000 );
#ifdef __ORACLE_TRACE__
	hm_oracle_step_end(position, direction);
#endif
}
'''
assert old in s, 'calculate_nextPos not found'
s=s.replace(old,new)
old = '''		found = s.will_be_a_Hit( player_id, factor, start, direction, galaxy );
		
		#ifdef __DEBUG__ 
'''
new = '''		found = s.will_be_a_Hit( player_id, factor, start, direction, galaxy );
#ifdef __ORACLE_TRACE__
		hm_oracle_ai_candidate(player_id, factor, searches, new_y, new_ShootPower, new_ShootAngle, found);
#endif
		
		#ifdef __DEBUG__ 
'''
assert old in s, 'ai hook not found'
s=s.replace(old,new)
old = '''void Wormhole::hit( Spaceobject *object )
{
	object->set_Pos( get_X()+exit_x, get_Y()+exit_y );
}
'''
new = '''void Wormhole::hit( Spaceobject *object )
{
#ifdef __ORACLE_TRACE__
	double from_x = object->get_X();
	double from_y = object->get_Y();
#endif
	object->set_Pos( get_X()+exit_x, get_Y()+exit_y );
#ifdef __ORACLE_TRACE__
	hm_oracle_wormhole(from_x, from_y, object->get_X(), object->get_Y(), object->get_Speed(), object->get_Direction());
#endif
}
'''
assert old in s, 'wormhole hit not found'
s=s.replace(old,new)
old = '''	shield_strength -= (int)( object->get_Speed() / 10 * object->get_Weight() );
	
	if (shield_strength < 0) 
		shield_strength = 0;

	object->hit( this );
'''
new = '''#ifdef __ORACLE_TRACE__
	int oracle_shield_before = shield_strength;
#endif
	shield_strength -= (int)( object->get_Speed() / 10 * object->get_Weight() );
	
	if (shield_strength < 0) 
		shield_strength = 0;
#ifdef __ORACLE_TRACE__
	hm_oracle_damage(oracle_shield_before, shield_strength, object->get_Speed(), object->get_Weight());
#endif

	object->hit( this );
'''
assert old in s, 'ufo damage not found'
s=s.replace(old,new)
p.write_text(s)

p=root/'shoot.cpp'; s=p.read_text()
old = '''void Shoot::activate( Vector_2 start, Vector_2 vector )
{
	set_Pos( start.getX(), start.getY() );
	direction = vector.getAngle();
	speed = vector.getLength();
	last_shootPos = start;
	is_exploding = false;
	moving_time = MAXSHOOTRUN;

	sound->play(SOUND_SHOOT);
}
'''
new = '''void Shoot::activate( Vector_2 start, Vector_2 vector )
{
	set_Pos( start.getX(), start.getY() );
	direction = vector.getAngle();
	speed = vector.getLength();
	last_shootPos = start;
	is_exploding = false;
	moving_time = MAXSHOOTRUN;
#ifdef __ORACLE_TRACE__
	hm_oracle_shot_activate(get_X(), get_Y(), speed, direction, weight);
#endif

	sound->play(SOUND_SHOOT);
}
'''
assert old in s, 'shoot activate not found'
s=s.replace(old,new)
old = '''void Shoot::calculate_ShootPath( Vector_2 start, Vector_2 direction, Galaxy *galaxy )
{
	static Vector_2 last_angle=Vector_2( 0, 0, K );
	static Vector_2 last_shoot=Vector_2( 0, 0, K );

	if ( last_angle != direction || last_shoot != start ) {

		pre_calculated_Steps = 0;
		last_angle = direction;
		last_shoot = start;
		
		for ( int i=0; i < MAXPRECALC; i++ ) {
			galaxy->calculate_nextPos( start, direction );
			double x = start.getX();
			double y = start.getY();
			
			if ( !galaxy->check_collision( x, y, get_Width() ) ) {	
				pre_calculated_Pos[i].x = (int)x;
				pre_calculated_Pos[i].y = (int)y; 
				pre_calculated_Steps++;
			} else break; 
		}
	}
}
'''
new = '''void Shoot::calculate_ShootPath( Vector_2 start, Vector_2 direction, Galaxy *galaxy )
{
	static Vector_2 last_angle=Vector_2( 0, 0, K );
	static Vector_2 last_shoot=Vector_2( 0, 0, K );

	if ( last_angle != direction || last_shoot != start ) {
#ifdef __ORACLE_TRACE__
		hm_oracle_shoot_path("shoot_path_begin", start, direction);
#endif
		pre_calculated_Steps = 0;
		last_angle = direction;
		last_shoot = start;
		
		for ( int i=0; i < MAXPRECALC; i++ ) {
			galaxy->calculate_nextPos( start, direction );
			double x = start.getX();
			double y = start.getY();
			
			if ( !galaxy->check_collision( x, y, get_Width() ) ) {	
				pre_calculated_Pos[i].x = (int)x;
				pre_calculated_Pos[i].y = (int)y; 
				pre_calculated_Steps++;
			} else break; 
		}
#ifdef __ORACLE_TRACE__
		hm_oracle_shoot_path("shoot_path_end", start, direction, pre_calculated_Steps);
#endif
	}
#ifdef __ORACLE_TRACE__
	else hm_oracle_shoot_path("shoot_path_cache_hit", start, direction, pre_calculated_Steps);
#endif
}
'''
assert old in s, 'shoot path not found'
s=s.replace(old,new)
old = '''	if ( moving_time > 0 ) {

		explosion->activate( x, y );
'''
idx=s.index('void Cluster::hit')
pos=s.find(old, idx)
assert pos!=-1, 'cluster split hook not found'
s=s[:pos]+s[pos:].replace(old, '''	if ( moving_time > 0 ) {
#ifdef __ORACLE_TRACE__
		hm_oracle_cluster_split(x, y, speed, direction);
#endif

		explosion->activate( x, y );
''',1)
p.write_text(s)

p=root/'main.cpp'; s=p.read_text(); assert 'srand(time(NULL));' in s; p.write_text(s.replace('srand(time(NULL));','HM_SRAND(time(NULL));'))
p=root/'graphics.cpp'; s=p.read_text(); assert '(rand()/(RAND_MAX+1.0) )' in s; p.write_text(s.replace('(rand()/(RAND_MAX+1.0) )','(HM_RAND()/(RAND_MAX+1.0) )'))

mk=Path('/mnt/data/highmoon_oracle_work/instrumented/HighMoon/Makefile')
s=mk.read_text()
s += '''\n# Libre Arcade archaeology oracle build. Does not alter the normal `all` target.\noracle: CXXFLAGS += -D__ORACLE_TRACE__\noracle: OBJS += $(SRCDIR)/oracle_trace.o\noracle: ufo\n'''
mk.write_text(s)
