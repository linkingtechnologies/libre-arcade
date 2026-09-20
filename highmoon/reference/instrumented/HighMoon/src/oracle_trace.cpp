#include "oracle_trace.hpp"

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
            trace_file = std::fopen(path, "w");
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
    std::fprintf(f, "\"%s\":%.17g,\"%s_bits\":\"%016llx\"",
                 name, value, name, bits(value));
}

void vec(FILE *f, const char *name, const Vector_2 &value)
{
    Vector_2 v = value;
    std::fprintf(f, "\"%s\":{", name);
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
        std::fprintf(f, "{\"event\":\"rng\",\"index\":%llu,\"raw\":%d,\"rand_max\":%d,\"file\":\"%s\",\"line\":%d}\n",
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
        std::fprintf(f, "{\"event\":\"srand\",\"seed\":%u,\"rng_index\":%llu,\"file\":\"%s\",\"line\":%d}\n",
                     seed, rng_index, file, line);
        std::fflush(f);
    }
}

void hm_oracle_galaxy_create(int requested_objects, int seed)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\"event\":\"galaxy_create\",\"requested_objects\":%d,\"seed\":%d}\n", requested_objects, seed);
}

void hm_oracle_fire_command(int player_id, int weapon_id, double power, double angle,
                            const Vector_2 &start, const Vector_2 &velocity)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\"event\":\"fire_command\",\"player\":%d,\"weapon_id\":%d,", player_id, weapon_id);
    num(f, "power", power); std::fprintf(f, ",");
    num(f, "angle", angle); std::fprintf(f, ",");
    vec(f, "start", start); std::fprintf(f, ",");
    vec(f, "velocity", velocity); std::fprintf(f, "}\n");
}

void hm_oracle_step_begin(const Vector_2 &position, const Vector_2 &direction)
{
    FILE *f = out();
    active_step = step_index++;
    if (!f) return;
    std::fprintf(f, "{\"event\":\"step_begin\",\"step\":%llu,", active_step);
    vec(f, "position", position); std::fprintf(f, ",");
    vec(f, "velocity", direction); std::fprintf(f, "}\n");
}

void hm_oracle_gravity_body(int index, double body_x, double body_y, double weight,
                            double distance, const Vector_2 &delta_v)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\"event\":\"gravity\",\"step\":%llu,\"body_index\":%d,", active_step, index);
    num(f, "body_x", body_x); std::fprintf(f, ",");
    num(f, "body_y", body_y); std::fprintf(f, ",");
    num(f, "weight", weight); std::fprintf(f, ",");
    num(f, "distance", distance); std::fprintf(f, ",");
    vec(f, "delta_v", delta_v); std::fprintf(f, "}\n");
}

void hm_oracle_step_end(const Vector_2 &position, const Vector_2 &direction)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\"event\":\"step_end\",\"step\":%llu,", active_step);
    vec(f, "position", position); std::fprintf(f, ",");
    vec(f, "velocity", direction); std::fprintf(f, "}\n");
}

void hm_oracle_collision(const char *kind, int index,
                         double collider_x, double collider_y, double collider_width,
                         double shot_x, double shot_y, double shot_width)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\"event\":\"collision\",\"kind\":\"%s\",\"index\":%d,", kind, index);
    num(f, "collider_x", collider_x); std::fprintf(f, ",");
    num(f, "collider_y", collider_y); std::fprintf(f, ",");
    num(f, "collider_width", collider_width); std::fprintf(f, ",");
    num(f, "shot_x", shot_x); std::fprintf(f, ",");
    num(f, "shot_y", shot_y); std::fprintf(f, ",");
    num(f, "shot_width", shot_width); std::fprintf(f, "}\n");
}

void hm_oracle_shoot_path(const char *event, const Vector_2 &start, const Vector_2 &direction, int steps)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\"event\":\"%s\",", event);
    vec(f, "start", start); std::fprintf(f, ",");
    vec(f, "velocity", direction);
    if (steps >= 0) std::fprintf(f, ",\"steps\":%d", steps);
    std::fprintf(f, "}\n");
}

void hm_oracle_ai_candidate(int player_id, int factor, int searches_remaining,
                            double y, double power, double angle, bool found)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\"event\":\"ai_candidate\",\"player\":%d,\"factor\":%d,\"searches_remaining\":%d,",
                 player_id, factor, searches_remaining);
    num(f, "y", y); std::fprintf(f, ",");
    num(f, "power", power); std::fprintf(f, ",");
    num(f, "angle", angle); std::fprintf(f, ",\"found\":%s}\n", found ? "true" : "false");
}

void hm_oracle_shot_activate(double x, double y, double speed, double direction, double weight)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\"event\":\"shot_activate\",");
    num(f, "x", x); std::fprintf(f, ",");
    num(f, "y", y); std::fprintf(f, ",");
    num(f, "speed", speed); std::fprintf(f, ",");
    num(f, "direction", direction); std::fprintf(f, ",");
    num(f, "weight", weight); std::fprintf(f, "}\n");
}

void hm_oracle_wormhole(double from_x, double from_y, double to_x, double to_y,
                        double speed, double direction)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\"event\":\"wormhole_teleport\",");
    num(f, "from_x", from_x); std::fprintf(f, ",");
    num(f, "from_y", from_y); std::fprintf(f, ",");
    num(f, "to_x", to_x); std::fprintf(f, ",");
    num(f, "to_y", to_y); std::fprintf(f, ",");
    num(f, "speed", speed); std::fprintf(f, ",");
    num(f, "direction", direction); std::fprintf(f, "}\n");
}

void hm_oracle_damage(double before, double after, double projectile_speed, double projectile_weight)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\"event\":\"ufo_damage\",");
    num(f, "shield_before", before); std::fprintf(f, ",");
    num(f, "shield_after", after); std::fprintf(f, ",");
    num(f, "projectile_speed", projectile_speed); std::fprintf(f, ",");
    num(f, "projectile_weight", projectile_weight); std::fprintf(f, "}\n");
}

void hm_oracle_cluster_split(double x, double y, double speed, double direction)
{
    FILE *f = out();
    if (!f) return;
    std::fprintf(f, "{\"event\":\"cluster_split\",");
    num(f, "x", x); std::fprintf(f, ",");
    num(f, "y", y); std::fprintf(f, ",");
    num(f, "speed", speed); std::fprintf(f, ",");
    num(f, "direction", direction); std::fprintf(f, "}\n");
}
