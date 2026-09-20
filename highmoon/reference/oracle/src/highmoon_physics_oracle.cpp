/*
 * HighMoon 1.2.4 physics oracle (headless)
 *
 * Purpose: execute the exact arithmetic order of Galaxy::calculate_nextPos()
 * while compiling against the original HighMoon Vector_2 implementation.
 * This does NOT replace the native instrumented oracle; it is a regression
 * harness to be compared against native JSONL traces.
 */
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <stdint.h>
#include <string>
#include <vector>

#include "vector_2.hpp"

static const int HM_SHOOT_INTERVAL = 30; // src/constants.hpp, HighMoon 1.2.4

struct Body {
    std::string name;
    double x;
    double y;
    double weight;
};

static unsigned long long bits(double value)
{
    union { double d; uint64_t u; } v;
    v.d = value;
    return (unsigned long long)v.u;
}

static void num(FILE *f, const char *name, double value)
{
    std::fprintf(f, "\"%s\":%.17g,\"%s_bits\":\"%016llx\"",
                 name, value, name, bits(value));
}

static void vec(FILE *f, const char *name, Vector_2 value)
{
    std::fprintf(f, "\"%s\":{", name);
    num(f, "x", value.getX());
    std::fprintf(f, ",");
    num(f, "y", value.getY());
    std::fprintf(f, "}");
}

static bool pair_arg(const char *text, double &a, double &b)
{
    char *end = NULL;
    a = std::strtod(text, &end);
    if (!end || *end != ',') return false;
    b = std::strtod(end + 1, &end);
    return end && *end == '\0';
}

static bool body_arg(const char *text, Body &b)
{
    std::string s(text);
    std::string::size_type p1=s.find(',');
    std::string::size_type p2=(p1==std::string::npos)?p1:s.find(',',p1+1);
    std::string::size_type p3=(p2==std::string::npos)?p2:s.find(',',p2+1);
    if (p1==std::string::npos || p2==std::string::npos || p3==std::string::npos) return false;
    b.name=s.substr(0,p1);
    b.x=std::strtod(s.substr(p1+1,p2-p1-1).c_str(),NULL);
    b.y=std::strtod(s.substr(p2+1,p3-p2-1).c_str(),NULL);
    b.weight=std::strtod(s.substr(p3+1).c_str(),NULL);
    return !b.name.empty();
}

static void usage(const char *argv0)
{
    std::fprintf(stderr,
        "Usage: %s --start X,Y --velocity VX,VY --body NAME,X,Y,WEIGHT [--body ...] --ticks N [--out FILE] [--scenario NAME]\n",
        argv0);
}

int main(int argc, char **argv)
{
    double sx=0, sy=0, vx=0, vy=0;
    bool have_start=false, have_velocity=false;
    int ticks=1;
    const char *out_path=NULL;
    const char *scenario="custom";
    bool projectile_roundtrip=false;
    std::vector<Body> bodies;

    for (int i=1; i<argc; ++i) {
        if (!std::strcmp(argv[i],"--start") && i+1<argc) {
            have_start=pair_arg(argv[++i],sx,sy);
        } else if (!std::strcmp(argv[i],"--velocity") && i+1<argc) {
            have_velocity=pair_arg(argv[++i],vx,vy);
        } else if (!std::strcmp(argv[i],"--body") && i+1<argc) {
            Body b;
            if (!body_arg(argv[++i],b)) { usage(argv[0]); return 2; }
            bodies.push_back(b);
        } else if (!std::strcmp(argv[i],"--ticks") && i+1<argc) {
            ticks=std::atoi(argv[++i]);
        } else if (!std::strcmp(argv[i],"--out") && i+1<argc) {
            out_path=argv[++i];
        } else if (!std::strcmp(argv[i],"--scenario") && i+1<argc) {
            scenario=argv[++i];
        } else if (!std::strcmp(argv[i],"--projectile-roundtrip")) {
            projectile_roundtrip=true;
        } else {
            usage(argv[0]); return 2;
        }
    }
    if (!have_start || !have_velocity || bodies.empty() || ticks<1) {
        usage(argv[0]); return 2;
    }

    FILE *f=stdout;
    if (out_path) {
        f=std::fopen(out_path,"w");
        if (!f) { std::perror(out_path); return 3; }
    }

    std::fprintf(f,"{\"event\":\"meta\",\"oracle\":\"highmoon-1.2.4-headless\",\"scenario\":\"%s\",\"shoot_interval_ms\":%d,\"body_count\":%u,\"projectile_roundtrip\":%s}\n",
                 scenario,HM_SHOOT_INTERVAL,(unsigned)bodies.size(),projectile_roundtrip?"true":"false");

    Vector_2 position(sx,sy,K);
    Vector_2 direction(vx,vy,K);

    for (int tick=0; tick<ticks; ++tick) {
        std::fprintf(f,"{\"event\":\"step_begin\",\"step\":%d,",tick);
        vec(f,"position",position); std::fprintf(f,","); vec(f,"velocity",direction); std::fprintf(f,"}\n");

        // Keep this block structurally aligned with Galaxy::calculate_nextPos().
        Vector_2 vec_toPlanets = Vector_2(0,0,K);
        for (unsigned i=0; i<bodies.size(); ++i) {
            Vector_2 vec_PlanetPos = Vector_2(bodies[i].x,bodies[i].y,K);
            double distance = vec_PlanetPos.distance(position);
            Vector_2 vec_toPlanet = vec_PlanetPos-position;
            vec_toPlanet = vec_toPlanet.newLength(bodies[i].weight/distance);

            std::fprintf(f,"{\"event\":\"gravity\",\"step\":%d,\"body_index\":%u,\"body_name\":\"%s\",",
                         tick,i,bodies[i].name.c_str());
            num(f,"body_x",bodies[i].x); std::fprintf(f,",");
            num(f,"body_y",bodies[i].y); std::fprintf(f,",");
            num(f,"weight",bodies[i].weight); std::fprintf(f,",");
            num(f,"distance",distance); std::fprintf(f,",");
            vec(f,"delta_v",vec_toPlanet); std::fprintf(f,"}\n");

            vec_toPlanets = vec_toPlanets+vec_toPlanet;
        }
        direction += vec_toPlanets;
        position += direction.newLength(direction.getLength()*HM_SHOOT_INTERVAL/1000);

        std::fprintf(f,"{\"event\":\"step_end\",\"step\":%d,",tick);
        vec(f,"position",position); std::fprintf(f,","); vec(f,"velocity",direction); std::fprintf(f,"}\n");

        // Laser/Heavy/Cluster store speed+angle and rebuild a polar Vector_2 next tick.
        if (projectile_roundtrip)
            direction = Vector_2(direction.getLength(), direction.getAngle(), P);
    }

    if (f!=stdout) std::fclose(f);
    return 0;
}
