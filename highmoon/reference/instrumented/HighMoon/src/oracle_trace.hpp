#ifndef __ORACLE_TRACE_HPP__
#define __ORACLE_TRACE_HPP__

#include "vector_2.hpp"

int hm_oracle_rand(const char *file, int line);
void hm_oracle_srand(unsigned int seed, const char *file, int line);
void hm_oracle_galaxy_create(int requested_objects, int seed);
void hm_oracle_fire_command(int player_id, int weapon_id, double power, double angle,
                            const Vector_2 &start, const Vector_2 &velocity);
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
