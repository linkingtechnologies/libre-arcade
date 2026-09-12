/*
 * This file is part of PSY PONG 3D.
 *
 * Copyright (C) 2008-2009 Quetzy Garcia, <quetzyg@users.sourceforge.net>
 * For news and updates, see <http://psypong3d.sourceforge.net/>
 *
 * PSY PONG 3D is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * PSY PONG 3D is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with PSY PONG 3D.  If not, see <http://www.gnu.org/licenses/>.
 */

#include "common.h"

struct __GAME
{
  char *title;        /* game title */
  short fullscreen;   /* game in full screen? */
  point window;       /* game window size */
  short score_limit;  /* game score limit */
  struct
  {
    short current;  /* current game mode */
    short previous; /* previous game mode */
  } mode;
  struct
  {
    FLOOR *o;     /* floor object */
    float width;  /* floor width */
    float depth;  /* floor depth */
  } f;
  struct
  {
    PLAYER *o[2]; /* player objects */
    short warp;   /* enable player warping? */
    short swap;   /* enable player swapping? */
    float size;   /* player size */
    float speed;  /* player speed */
  } p;
  struct
  {
    BALL *o;            /* ball object */
    short draw_vectors; /* draw ball vectors? */
    float radius;       /* ball radius */
    float speed;        /* ball speed */
  } b;
  struct
  {
    CAMERA *o;    /* camera object */
    short reset;  /* reset camera? */
    short rotate; /* rotate camera? */
    float speed;  /* camera rotation speed */
  } c;
  KEYBOARD *k;  /* keyboard routine with multiple input support */
  struct
  {
    short increase;   /* increase game level? */
    unsigned start;   /* start level */
    unsigned current; /* current level */
  } level;
  struct
  {
    short show;   /* show frames per second? */
    float rate;   /* frame rate */
    short sample;
  } fps;
  struct
  {
    GLuint menu;  /* game menu texture */
    GLuint bg;    /* game background texture */
  } texture;
  struct
  {
    time_t menu;    /* menu timeout */
    time_t elapsed; /* elapsed game time */
    time_t lock;    /* time lock */
  } time;
};

static GAME *g = NULL;
static GLfloat rgba_game[4] = {0.25f, 0.25f, 1.0f, 0.8f};

/* (private) calculate frames per second */
static void __game_fps(GAME *game)
{
  static clock_t last = 0;
  clock_t now;
  float delta;

  if (game->fps.sample++ >= GAME_FPS_SAMPLES)
  {
    now = clock();
    delta = (now - last) / (float) CLOCKS_PER_SEC;
    last = now;

    game->fps.rate = GAME_FPS_SAMPLES / delta;
    game->fps.sample = 0;
   }
}

/* (private) change from 3d to 2d matrix */
static void __game_2d_start(void)
{
  glLoadIdentity();

  glMatrixMode(GL_PROJECTION);

  glPushMatrix();

  glLoadIdentity();
  glOrtho(0.0f, g->window.X, 0.0f, g->window.Y, 0.0f, 1.0f);
  glDisable(GL_LIGHTING);
  glDisable(GL_DEPTH_TEST);
}

/* (private) change from 2d to 3d matrix */
static void __game_2d_stop(void)
{
  glPopMatrix();
  glMatrixMode(GL_MODELVIEW);
  glEnable(GL_LIGHTING);
  glEnable(GL_DEPTH_TEST);
}

/* (private) enable blending options */
static void __game_blend_start(void)
{
  glDisable(GL_DEPTH_TEST);
  glEnable(GL_BLEND);
  glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
}

/* (private) disable blending options */
static void __game_blend_stop(void)
{
  glEnable(GL_DEPTH_TEST);
  glDisable(GL_BLEND);
}

/* (private) control key press */
static void __game_key_press(int key, int x, int y)
{
  (void) x;
  (void) y;

  /* pause/unpause game */
  if (key == KEY_SPACE && g->mode.current != GAME_MODE_DEMO && g->mode.current != GAME_MODE_MENU)
  {
    if (g->mode.current != GAME_MODE_PAUSE)
    {
      g->mode.previous = g->mode.current;
      g->mode.current = GAME_MODE_PAUSE;
    }
    else if (g->mode.current == GAME_MODE_PAUSE)
    {
      g->mode.current = g->mode.previous;
      g->mode.previous = GAME_MODE_PAUSE;
    }
  }
}

/* (private) control key release */
static void __game_key_release(int key, int x, int y)
{
  (void) x;
  (void) y;

  /* go to menu or leave game */
  if (key == KEY_ESCAPE)
  {
    if (g->mode.current == GAME_MODE_MENU)
      exit(EXIT_SUCCESS);
    else
      g->mode.current = GAME_MODE_MENU;
  }

  /* menu keys */
  if (g->mode.current == GAME_MODE_MENU)
  {
    if (key == KEY_F1)
    {
      g->mode.current = GAME_MODE_SINGLE;
      g->time.elapsed = time(NULL);
      g->level.current = g->level.start;
    }

    if (key == KEY_F2)
    {
      g->mode.current = GAME_MODE_DUAL;
      g->time.elapsed = time(NULL);
      g->level.current = g->level.start;
    }
  }
}

/* (private) pause game */
static void __game_pause(GAME *game)
{
  __game_2d_start();
    glColor3f(drand48(), drand48(), drand48());
    bmp_render_string("PAUSE", (game->window.X / 2) - 30.0f, game->window.Y / 2);
  __game_2d_stop();
}

/* (private) idle callback function */
static void __game_idle(void)
{
  __game_fps(g);

  /* player 1 keys */
  if (g->mode.current == GAME_MODE_SINGLE || g->mode.current == GAME_MODE_DUAL)
  {
    if (keyboard_key_pressed(g->k, 'q') || keyboard_key_pressed(g->k, 'Q'))
      if (g->p.warp || player_get_center(g->p.o[PLAYER_1]) > floor_get_z(g->f.o) - player_get_width(g->p.o[PLAYER_1]))
        player_add_z(g->p.o[PLAYER_1], -g->p.speed);

    if (keyboard_key_pressed(g->k, 'a') || keyboard_key_pressed(g->k, 'A'))
      if (g->p.warp || player_get_center(g->p.o[PLAYER_1]) < floor_get_z(g->f.o) + floor_get_depth(g->f.o) + player_get_width(g->p.o[PLAYER_1]))
        player_add_z(g->p.o[PLAYER_1], g->p.speed);
  }

  /* player 2 keys */
  if (g->mode.current == GAME_MODE_DUAL)
  {
    if (keyboard_key_pressed(g->k, KEY_UP))
    if (g->p.warp || player_get_center(g->p.o[PLAYER_2]) > floor_get_z(g->f.o) - player_get_width(g->p.o[PLAYER_2]))
      player_add_z(g->p.o[PLAYER_2], -g->p.speed);

    if (keyboard_key_pressed(g->k, KEY_DOWN))
      if (g->p.warp || player_get_center(g->p.o[PLAYER_2]) < floor_get_z(g->f.o) + floor_get_depth(g->f.o) + player_get_width(g->p.o[PLAYER_2]))
        player_add_z(g->p.o[PLAYER_2], g->p.speed);
  }

  glutPostRedisplay();
}

/* (private) reshape callback function */
static void __game_reshape(GLsizei w, GLsizei h)
{
  /* update game variables */
  g->window.X = (float) w;
  g->window.Y = (float) h;

  glViewport(0, 0, w, h);
  glMatrixMode(GL_PROJECTION);
  glLoadIdentity();
  gluPerspective(GAME_CAMERA_FOVY, (GLfloat) (g->window.X / g->window.Y), 1.0f, g->window.Z);
  glMatrixMode (GL_MODELVIEW);
}

/* (private) game timer */
static void __game_timer(int value)
{
  /* rotate camera randomly */
  if (g->c.rotate && g->mode.current != GAME_MODE_MENU && g->mode.current != GAME_MODE_PAUSE)
  {
    camera_rotate_random(g->c.o, g->c.speed);
    glutPostRedisplay();
  }

  glutTimerFunc(GAME_TIMER, __game_timer, value);
}

/* (private) control player movements automatically */
static void __game_auto_pilot(PLAYER *player, BALL *ball)
{
  player_add_z(player, (g->p.speed * ((ball_get_z(ball) > player_get_center(player)) ? 1 : -1)));
}

/* (private) opengl options */
static void __game_gl_options(void)
{
  glEnable(GL_DEPTH_TEST);
  glEnable(GL_COLOR_MATERIAL);
  glEnable(GL_LIGHTING);
  glEnable(GL_LIGHT0);
  glEnable(GL_LIGHT1);
  glEnable(GL_LIGHT2);
  glEnable(GL_NORMALIZE);
  glEnable(GL_POLYGON_SMOOTH);
  glShadeModel(GL_SMOOTH);
  glDepthFunc(GL_LEQUAL);

  glHint(GL_PERSPECTIVE_CORRECTION_HINT, GL_NICEST);
  glHint(GL_POLYGON_SMOOTH_HINT, GL_NICEST);
  glHint(GL_POINT_SMOOTH_HINT, GL_NICEST);
  glHint(GL_LINE_SMOOTH_HINT, GL_NICEST);
}

/* (private) game menu */
static void __game_menu(GAME *game)
{
  char string[16];

  snprintf(string, sizeof(char) * sizeof(string), "VERSION %s", GAME_VERSION);

  /* enter demo mode if no option is selected during GAME_MENU_TIMEOUT seconds */
  if (time(NULL) % game->time.menu > GAME_MENU_TIMEOUT)
  {
    game->mode.current = GAME_MODE_DEMO;
    game->time.elapsed = time(NULL);
    game->level.current = game->level.start;
  }

  camera_reset(game->c.o);
  player_reset(game->p.o[PLAYER_1]);
  player_reset(game->p.o[PLAYER_2]);
  ball_reset(game->b.o);

  glLoadIdentity();

  __game_2d_start();
    bmp_render_texture(game->texture.menu, game->window.X, game->window.Y, rgba_game);

    glColor3f(drand48(), drand48(), drand48());
    bmp_render_string("[F1] 1 PLAYER", (game->window.X / 2) - 60.0f, game->window.Y / 2 - 20.0f);
    bmp_render_string("[F2] 2 PLAYERS", (game->window.X / 2) - 60.0f, game->window.Y / 2 - 60.0f);
    bmp_render_string("[ESC] QUIT", (game->window.X / 2) - 60.0f, game->window.Y / 2 - 100.0f);

    glColor4fv(rgba_game);
    bmp_render_string(string, 16.0f, 16.0f);
  __game_2d_stop();
}

/* (private) game lights */
static void __game_lights(GAME *game)
{
  /* ambient light intensity */
  GLfloat ambient_rgba[4] = {0.1f, 0.1f, 0.1f, 1.0f};

  /* element light positions */
  GLfloat light_ball_pos[4] = {ball_get_x(game->b.o), 32.0f, ball_get_z(game->b.o), 0.0f};
  GLfloat light_p1_pos[4] = {player_get_x(game->p.o[PLAYER_1]), 32.0f, player_get_z(game->p.o[PLAYER_1]), 0.0f};
  GLfloat light_p2_pos[4] = {player_get_x(game->p.o[PLAYER_2]), 32.0f, player_get_z(game->p.o[PLAYER_2]), 0.0f};

  /* ambient light */
  glLightModelfv(GL_LIGHT_MODEL_AMBIENT, ambient_rgba);

  /* ball */
  glLightfv(GL_LIGHT0, GL_POSITION, light_ball_pos);
  glLightfv(GL_LIGHT0, GL_DIFFUSE, ball_get_rgba(game->b.o));
  glLightfv(GL_LIGHT0, GL_SPECULAR, ball_get_rgba(game->b.o));
  glLightfv(GL_LIGHT0, GL_AMBIENT, ambient_rgba);

  /* player 1 */
  glLightfv(GL_LIGHT1, GL_POSITION, light_p1_pos);
  glLightfv(GL_LIGHT1, GL_DIFFUSE, player_get_rgba(game->p.o[PLAYER_1]));
  glLightfv(GL_LIGHT1, GL_SPECULAR, player_get_rgba(game->p.o[PLAYER_1]));
  glLightfv(GL_LIGHT1, GL_AMBIENT, ambient_rgba);

  /* player 2 */
  glLightfv(GL_LIGHT2, GL_POSITION, light_p2_pos);
  glLightfv(GL_LIGHT2, GL_DIFFUSE, player_get_rgba(game->p.o[PLAYER_2]));
  glLightfv(GL_LIGHT2, GL_SPECULAR, player_get_rgba(game->p.o[PLAYER_2]));
  glLightfv(GL_LIGHT2, GL_AMBIENT, ambient_rgba);
}

/* (private) game logic */
static void __game_display(void)
{
  /* game background RGBA */
  GLfloat rgba_bg[4] = {0.95f, 0.95f, 0.95f, 1.0f};
  char string[24];

  if (g->mode.current == GAME_MODE_MENU)
    __game_menu(g);

  else if (g->mode.current == GAME_MODE_PAUSE)
    __game_pause(g);

  else
  {
    /* increase the game level every GAME_LEVEL_INCREASE_VALUE seconds */
    if (g->level.increase && time(NULL) != g->time.lock && (time(NULL) - g->time.elapsed) % GAME_LEVEL_INCREASE_VALUE == (GAME_LEVEL_INCREASE_VALUE - 1))
    {
      g->time.lock = time(NULL);
      g->level.current++;
    }

    /* update speeds */
    g->p.speed = (g->level.current * 0.02f);
    g->b.speed = (g->p.speed * 0.8f);
    g->c.speed = remainderf((float) g->level.current * 0.02f, 360.0f);

    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
    glClearDepth(1.0f);

    __game_gl_options();

    glLoadIdentity();

    /* draw game background */
    __game_2d_start();
      glPushMatrix();
        bmp_render_texture(g->texture.bg, g->window.X, g->window.Y, rgba_bg);
      glPopMatrix();
    __game_2d_stop();

    /* set game lights */
    __game_lights(g);

    camera_display(g->c.o);

    /* game twists */
    srand(time(NULL));
    player_warp(g->p.o, g->f.o, 2, g->p.warp);
    player_swap(g->p.o, 2, g->p.swap && !ball_get_x(g->b.o) && (g->level.current > rand()%(g->level.current + 1)) && rand()%2 && (player_get_score(g->p.o[PLAYER_1]) || player_get_score(g->p.o[PLAYER_2])));

    /* game logic */
    ball_move(g->b.o, g->b.speed);
    ball_collisions(g->b.o, g->f.o, g->p.o, 2);

    /* see if anyone scored */
    if (ball_left_floor(g->b.o, g->f.o, g->p.o, 2) && g->c.reset)
      camera_reset(g->c.o);

    /* draw game elements */
    __game_blend_start();
      floor_draw_model(g->f.o);
    __game_blend_stop();

    player_draw_model(g->p.o[PLAYER_1]);
    player_draw_model(g->p.o[PLAYER_2]);
    ball_draw_model(g->b.o);

    if (g->b.draw_vectors)
      ball_draw_vectors(g->b.o, g->f.o, rgba_game);

    /* control player 1 on demo mode */
    if (g->level.current > rand()%(g->level.current + 1) && g->mode.current == GAME_MODE_DEMO)
      __game_auto_pilot(g->p.o[PLAYER_1], g->b.o);

    /* control player 2 on demo and single mode */
    if (g->level.current > rand()%(g->level.current + 1) && g->mode.current != GAME_MODE_DUAL)
      __game_auto_pilot(g->p.o[PLAYER_2], g->b.o);

    __game_2d_start();
      /* player 1 score */
      glColor4fv(player_get_rgba(g->p.o[PLAYER_1]));
      snprintf(string, sizeof(char) * sizeof(string), "SCORE: %d/%d", player_get_score(g->p.o[PLAYER_1]), g->score_limit);
      bmp_render_string(string, 8.0f, g->window.Y - 30.0f);

      /* player 2 score */
      glColor4fv(player_get_rgba(g->p.o[PLAYER_2]));
      snprintf(string, sizeof(char) * sizeof(string), "SCORE: %d/%d", player_get_score(g->p.o[PLAYER_2]), g->score_limit);
      bmp_render_string(string, 8.0f, g->window.Y - 60.0f);

      if (g->mode.current == GAME_MODE_DEMO) /* game demo message */
      {
        glColor3f(drand48(), drand48(), drand48());
        bmp_render_string("GAME DEMO", (g->window.X / 2) - 60.0f, g->window.Y / 2);
      }

      if (g->fps.show) /* FPS */
      {
        glColor3f(1.0f, 1.0f, 0.0f);
        snprintf(string, sizeof(char) * sizeof(string), "FPS: %.1f", g->fps.rate);
        bmp_render_string(string, 8.0f, 32.0f);
      }

      /* game level */
      glColor3f(1.0f, 1.0f, 0.0f);
      snprintf(string, sizeof(char) * sizeof(string), "GAME LEVEL: %d", g->level.current);
      bmp_render_string(string, 8.0f, 8.0f);
    __game_2d_stop();

    g->time.menu = time(NULL); /* reset menu timeout */
  }

  usleep(GAME_SLEEP_U);
  glutSwapBuffers();

  /* did someone win? */
  if (player_won(g->p.o[PLAYER_1], g->score_limit) || player_won(g->p.o[PLAYER_2], g->score_limit))
  {
    int winner = (player_won(g->p.o[PLAYER_1], g->score_limit) ? PLAYER_1 : PLAYER_2);

    /* show who won the match */
    if (g->mode.current != GAME_MODE_DEMO)
    {
      __game_2d_start();
        glColor4fv(player_get_rgba(g->p.o[winner]));
        snprintf(string, sizeof(char) * sizeof(string), "PLAYER %d WON!", winner + 1);
        bmp_render_string(string, g->window.X / 2 - (strlen(string) / 2.0f) * 10.0f, g->window.Y / 2);
      __game_2d_stop();

      glutSwapBuffers();

      sleep(GAME_SLEEP_S);
    }

    g->mode.current = GAME_MODE_MENU;
  }
}

/* (private) initialize opengl */
static void __game_gl_init(GAME *game, int argc, char **argv)
{
  char res[16];
  snprintf(res, sizeof(char) * sizeof(res), "%dx%d", (int) game->window.X, (int) game->window.Y);

  glutInit(&argc, argv);
  glutInitDisplayMode(GLUT_RGBA | GLUT_DOUBLE | GLUT_DEPTH);

  if (game->fullscreen)
  {
    glutGameModeString(res);

    if (glutGameModeGet(GLUT_GAME_MODE_POSSIBLE))
      glutEnterGameMode();
    else
    {
      game->fullscreen = 0; /* try fall backing to window mode */
      fprintf(stderr, "Warning: Cannot set '%s' in full screen, trying window mode...\n", res);
    }
  }

  if (!game->fullscreen)
  {
    glutInitWindowSize(game->window.X, game->window.Y);
    glutInitWindowPosition(16, 16);
    glutCreateWindow(game->title);
  }

  /* hide mouse cursor */
  glutSetCursor(GLUT_CURSOR_NONE);

  /* register callback functions */
  glutIdleFunc(__game_idle);
  glutDisplayFunc(__game_display);
  glutReshapeFunc(__game_reshape);
  glutTimerFunc(GAME_TIMER, __game_timer, 0);
}

/* (private) print game help */
static void __game_help(GAME *game, char *app)
{
  free(game);

  fprintf(stderr,
    "Usage: %s [options]\n\n"\
    "General options:\n"\
    " --fs\t\tRun game in full screen\n"\
    " --fps\t\tShow frames per second\n"\
    " --resx <x>\tSet X resolution (default: %d)\n"\
    " --resy <y>\tSet Y resolution (default: %d)\n"\
    " --help\t\tOutput this help\n\n"\
    "Gameplay specific options:\n"
    " --no-inc\tDisable game level increase\n"\
    " --level <%d-%d>Set starting game level (default: %d)\n"\
    " --limit <%d-%d>\tSet score limit (default: %d)\n\n"\
    "Floor specific options:\n"\
    " --fw <%.0f-%.0f>\tSet floor width (default: %.1f)\n"\
    " --fd <%.0f-%.0f>\tSet floor depth (default: %.1f)\n\n"\
    "Player specific options:\n"\
    " --size <%.0f-%.0f>\tSet player size (default: %.1f)\n"\
    " --no-warp\tDisable player warping\n"\
    " --no-swap\tDisable player swapping\n\n"\
    "Ball specific options:\n"\
    " --vec\t\tShow ball X, Y and Z vectors (may help on funny angles)\n"\
    " --rad <%.0f-%.0f>\tSet ball radius (default: %.1f)\n\n"\
    "Camera specific options:\n"\
    " --no-rot\tDisable random camera rotation\n"\
    " --no-reset\tDisable camera reset after scoring\n",
    app,
    GAME_WINDOW_X,
    GAME_WINDOW_Y,
    GAME_LEVEL_MIN, GAME_LEVEL_MAX, GAME_LEVEL_START,
    GAME_SCORE_LIMIT_MIN, GAME_SCORE_LIMIT_MAX, GAME_SCORE_LIMIT,
    GAME_FLOOR_SIZE_MIN, GAME_FLOOR_SIZE_MAX, GAME_FLOOR_WIDTH,
    GAME_FLOOR_SIZE_MIN, GAME_FLOOR_SIZE_MAX, GAME_FLOOR_DEPTH,
    GAME_PLAYER_SIZE_MIN, GAME_PLAYER_SIZE_MAX, GAME_PLAYER_SIZE,
    GAME_BALL_RADIUS_MIN, GAME_BALL_RADIUS_MAX, GAME_BALL_RADIUS
  );

  exit(0);
}

/* (private) configure game according to passed arguments */
static void __game_config(GAME *game, int argc, char **argv)
{
  int index = 0;
  int opt;
  int tmp_i;
  float tmp_f;
  static struct option options[] =
  {
    {"fs", no_argument, NULL, 'a'},           /* run game in full screen */
    {"fps", no_argument, NULL, 'b'},          /* show frames per second */
    {"resx", required_argument, NULL, 'c'},   /* set X resolution */
    {"resy", required_argument, NULL, 'd'},   /* set Y resolution */
    {"help", no_argument, NULL, 'e'},         /* print game help */
    {"no-inc", no_argument, NULL, 'f'},       /* disable game level increase */
    {"level", required_argument, NULL, 'g'},  /* set starting game level */
    {"limit", required_argument, NULL, 'h'},  /* set score limit */
    {"fw", required_argument, NULL, 'i'},     /* set floor width */
    {"fd", required_argument, NULL, 'j'},     /* set floor depth */
    {"size", required_argument, NULL, 'k'},   /* set player size */
    {"no-warp", no_argument, NULL, 'l'},      /* disable player warping */
    {"no-swap", no_argument, NULL, 'm'},      /* disable player swapping */
    {"vec", no_argument, NULL, 'n'},          /* show ball X, Y and Z vectors */
    {"rad", required_argument, NULL, 'o'},    /* set ball radius */
    {"no-rot", no_argument, NULL, 'p'},       /* disable random camera rotation */
    {"no-reset", no_argument, NULL, 'q'},     /* disable camera reset after scoring */
    {NULL, no_argument, NULL, 0}
  };

  /*
   * define default game settings
   *
   * these cannot be changed via command line options
   */
  game->title = strdup(GAME_TITLE);
  game->fps.rate = 0.0f;
  game->fps.sample = 0;
  game->mode.current = game->mode.previous = GAME_MODE_MENU;
  game->window.Z = GAME_WINDOW_Z;

  /* but these can :) */
  game->fullscreen = 0;
  game->fps.show = GAME_FPS_SHOW;
  game->window.X = (float) GAME_WINDOW_X;
  game->window.Y = (float) GAME_WINDOW_Y;
  game->level.increase = GAME_LEVEL_INCREASE;
  game->level.current = game->level.start = GAME_LEVEL_START;
  game->score_limit = GAME_SCORE_LIMIT;
  game->f.width = GAME_FLOOR_WIDTH;
  game->f.depth = GAME_FLOOR_DEPTH;
  game->p.size = GAME_PLAYER_SIZE;
  game->p.warp = GAME_PLAYER_WARP;
  game->p.swap = GAME_PLAYER_SWAP;
  game->b.draw_vectors = GAME_BALL_DRAW_VECTORS;
  game->b.radius = GAME_BALL_RADIUS;
  game->c.rotate = GAME_CAMERA_ROTATE;
  game->c.reset = GAME_CAMERA_RESET;

  while(1)
  {
    opt = getopt_long(argc, argv, "", options, &index);

    if (opt == -1) /* we reached the end */
      break;

    switch (opt)
    {
      case 'a': /* display game in full screen */
        game->fullscreen = 1;
      break;

      case 'b': /* show frames per second */
        game->fps.show = 1;
      break;

      case 'c': /* set X resolution */
        tmp_i = atoi(optarg);

        if (tmp_i >= GAME_RESOLUTION_X_MIN && tmp_i <= GAME_RESOLUTION_X_MAX)
          game->window.X = tmp_i;
      break;

      case 'd': /* set Y resolution */
        tmp_i = atoi(optarg);

        if (tmp_i >= GAME_RESOLUTION_Y_MIN && tmp_i <= GAME_RESOLUTION_Y_MAX)
          game->window.Y = tmp_i;
      break;

      case 'e': /* print game help */
        __game_help(game, argv[0]);
      break;

      case 'f': /* disable game level increase */
        game->level.increase = 0;
      break;

      case 'g': /* set starting game level */
        tmp_i = atoi(optarg);

        if (tmp_i >= GAME_LEVEL_MIN && tmp_i <= GAME_LEVEL_MAX)
          game->level.current = game->level.start = tmp_i;
      break;

      case 'h': /* set score limit */
        tmp_i = atoi(optarg);

        if (tmp_i >= GAME_SCORE_LIMIT_MIN && tmp_i <= GAME_SCORE_LIMIT_MAX)
          game->score_limit = tmp_i;
      break;

      case 'i': /* set floor width */
        tmp_f = atof(optarg);

        if (tmp_f >= GAME_FLOOR_SIZE_MIN && tmp_f <= GAME_FLOOR_SIZE_MAX)
          game->f.width = tmp_f;
      break;

      case 'j': /* set floor depth */
        tmp_f = atof(optarg);

        if (tmp_f >= GAME_FLOOR_SIZE_MIN && tmp_f <= GAME_FLOOR_SIZE_MAX)
          game->f.depth = tmp_f;
      break;

      case 'k': /* set player size */
        tmp_f = atof(optarg);

        if (tmp_f >= GAME_PLAYER_SIZE_MIN && tmp_f <= GAME_PLAYER_SIZE_MAX)
          game->p.size = tmp_f;
      break;

      case 'l': /* disable player warping */
        game->p.warp = 0;
      break;

      case 'm': /* disable player swapping */
        game->p.swap = 0;
      break;

      case 'n': /* show ball X, Y and Z vectors */
        game->b.draw_vectors = 1;
      break;

      case 'o': /* set ball radius */
        tmp_f = atof(optarg);

        if (tmp_f >= GAME_BALL_RADIUS_MIN && tmp_f <= GAME_BALL_RADIUS_MAX)
          game->b.radius = tmp_f;
      break;

      case 'p': /* disable random camera rotation */
        game->c.rotate = 0;
      break;

      case 'q': /* disable camera reset */
        game->c.reset = 0;
      break;

      case '?': /* show help screen if an invalid option has been passed */
        __game_help(game, argv[0]);
      break;
    }
  }
}

/* create a new game */
GAME *game_new(int argc, char **argv)
{
  GLfloat rgb_p1[4] = {0.71f, 0.13f, 0.51f, 1.0f};
  GLfloat rgb_p2[4] = {0.03, 0.73f, 0.96f, 1.0f};
  GLfloat rgb_ball[4] = {1.0f, 0.84f, 0.0f, 1.0f};

  GAME *game = NULL;
  BMP *bmp = NULL;

  if ((game = (GAME *) malloc(sizeof(GAME))) == NULL)
    return NULL;

  /* set known states for objects */
  game->f.o = NULL;
  game->p.o[PLAYER_1] = NULL;
  game->p.o[PLAYER_2] = NULL;
  game->b.o = NULL;
  game->c.o = NULL;
  game->k = NULL;
  game->texture.menu = 0;
  game->texture.bg = 0;

  __game_config(game, argc, argv); /* parse command line options */
  __game_gl_init(game, argc, argv);

  /* load menu texture file */
  if ((bmp = bmp_new(GAME_TEXTURE_MENU)) == NULL)
  {
    game_free(0, game);
    return NULL;
  }

  game->texture.menu = bmp_to_texture(bmp);
  bmp_free(bmp);

  /* load background texture file */
  if ((bmp = bmp_new(GAME_TEXTURE_BACKGROUND)) == NULL)
  {
    game_free(0, game);
    return NULL;
  }

  game->texture.bg = bmp_to_texture(bmp);
  bmp_free(bmp);

 /* create floor */
  if ((game->f.o = floor_new(0.0f + (-game->f.width / 2),
    0.0f,
    0.0f + (-game->f.depth / 2),
    game->f.width,
    game->f.depth,
    rgba_game,
    GAME_TEXTURE_FLOOR)) == NULL)
  {
    game_free(0, game);
    return NULL;
  }

  /* create players */
  game->p.o[PLAYER_1] = player_new(floor_get_x(game->f.o) - game->p.size / 2,
    0.0f,
    0.0f - game->p.size * 2,
    game->p.size,
    rgb_p1);

  game->p.o[PLAYER_2] = player_new(floor_get_x(game->f.o) + floor_get_width(game->f.o) + game->p.size / 2,
    0.0f,
    0.0f - game->p.size * 2,
    game->p.size,
    rgb_p2);

  if (game->p.o[PLAYER_1] == NULL || game->p.o[PLAYER_2] == NULL)
  {
    game_free(0, game);
    return NULL;
  }

  /* create ball */
  if ((game->b.o = ball_new(0.0f,
    0.0f,
    0.0f,
    game->b.radius,
    rgb_ball)) == NULL)
  {
    game_free(0, game);
    return NULL;
  }

  /* set camera viewing distance according to floor size */
  float diff = fabsf(game->f.width - game->f.depth);
  float dist = diff + (game->f.width < game->f.depth) ? -game->f.width : -game->f.depth;

  /* create game camera */
  if ((game->c.o = camera_new(0.0f, 0.0f, dist, 45.0f, 0.0f, 0.0f)) == NULL)
  {
    game_free(0, game);
    return NULL;
  }

  /* create game keyboard routine */
  if ((game->k = keyboard_new(__game_key_press, __game_key_release)) == NULL)
  {
    game_free(0, game);
    return NULL;
  }

  /* return game pointer and set a private one for callback access */
  return (g = game);
}

/* free game resources */
void game_free(int i, GAME *game)
{
  (void) i;

  if (game->fullscreen)
    glutLeaveGameMode();

  if (game != NULL)
  {
    glDeleteTextures(1, &game->texture.menu);
    glDeleteTextures(1, &game->texture.bg);
    free(game->title);
  }

  keyboard_free(game->k);
  camera_free(game->c.o);
  ball_free(game->b.o);
  player_free(game->p.o[PLAYER_2]);
  player_free(game->p.o[PLAYER_1]);
  floor_free(game->f.o);

  free(game);
}

/* start the game */
void game_start(GAME *game)
{
  game->time.menu = game->time.lock = time(NULL);

  glutMainLoop();
}
