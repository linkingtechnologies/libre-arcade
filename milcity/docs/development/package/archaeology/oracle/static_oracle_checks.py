from pathlib import Path
import re, sys
root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('MilCity-Blue')
ai = (root/'src/fr/uha/ensisa/ir/walther/milcityblue/core/players/AIPlayer.java').read_text()
cfg = (root/'src/fr/uha/ensisa/ir/walther/milcityblue/core/Config.java').read_text()
engine = (root/'src/fr/uha/ensisa/ir/walther/milcityblue/gui/GameEngine.java').read_text()
checks = {
 'four_levels': all(x in ai for x in ['LEVEL_EASY = 0','LEVEL_MEDIUM = 1','LEVEL_HARD = 2','LEVEL_MADNESS = 3']),
 'easy_missile': 'level == LEVEL_EASY' in ai and 'BUILDING_MISSILESILO' in ai,
 'medium_factory': 'level == LEVEL_MEDIUM' in ai and 'BUILDING_FACTORY' in ai,
 'hard_airfield': 'level == LEVEL_HARD' in ai and 'BUILDING_AIRFIELD' in ai,
 'madness_nuke': 'level == LEVEL_MADNESS' in ai and 'BUILDING_NUKESILO' in ai,
 'no_ai_spy_fire': 'fire(Weapon.WEAPON_SPY)' not in ai,
 'no_ai_shield_fire': 'fire(Weapon.WEAPON_SHIELD)' not in ai,
 'fresh_random': ai.count('new Random()') >= 3,
 'target_retry_10': 'tries < 10' in ai,
 'ai_tick_1s': 'Thread.sleep(1000)' in ai,
 'grid_30x30': 'DEFAULT_GRID_SIZE_X = 30' in cfg and 'DEFAULT_GRID_SIZE_Y = 30' in cfg,
 'score_1000': 'DEFAULT_SCORE_TO_WIN = 1000' in cfg,
 'money_100': 'DEFAULT_MONEY_AT_START = 100' in cfg,
 'water_50': 'DEFAULT_PERCENT_OF_WATER = 50' in cfg,
 'blackout_120': 'MAX_TIME_BELLOW_ZERO = 120' in cfg,
 'render_sleep': '1000 / fps' in engine,
}
failed = [k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('PASS' if v else 'FAIL'), k)
print(f'\n{len(checks)-len(failed)}/{len(checks)} checks passed')
sys.exit(1 if failed else 0)
