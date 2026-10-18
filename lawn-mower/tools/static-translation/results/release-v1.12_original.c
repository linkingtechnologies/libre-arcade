// Generated from identified opcode ranges in Shiru's Lawn Mower ROM.
// NOT NESRecomp. External APU/SFX routines are trapped as observable events.
#include <stdint.h>
#include <stdio.h>
typedef struct { int fuel, camera_shake, low_fuel_sfx, stone_sfx; } StoneResult;
int stone_run(unsigned initial, StoneResult *o) {
  uint8_t m[256]={0}, a=0; int carry=0,low=0,stone=0;
  uint16_t ret[3]; int sp=0;
  unsigned pc=0xcb6e;
  m[0xcb]=(uint8_t)initial;
  for(int steps=0;steps<100;steps++) switch(pc) {
    case 0xcb6e: a=1; pc=52080; break; /* LDA_IMM 01 */
    case 0xcb70: m[186]=a; pc=52082; break; /* STA_ZP ba */
    case 0xcb72: a=77; pc=52084; break; /* LDA_IMM 4d */
    case 0xcb74: if (sp>=3)return -2; ret[sp++]=52087; pc=52118; break; /* JSR 96 cb */
    case 0xcb77: a=11; pc=52089; break; /* LDA_IMM 0b */
    case 0xcb79: if (a!=11)return -4; stone++; goto done; /* external sfxPlay trap */ break; /* JMP eb cd */
    case 0xcb96: m[0]=a; pc=52120; break; /* STA_ZP 00 */
    case 0xcb98: a=m[203]; pc=52122; break; /* LDA_ZP cb */
    case 0xcb9a: m[1]=a; pc=52124; break; /* STA_ZP 01 */
    case 0xcb9c: carry=1; pc=52125; break; /* SEC  */
    case 0xcb9d: { int v=(int)a-(int)m[0]-(carry?0:1); carry=(v>=0); a=(uint8_t)v; pc=52127; } break; /* SBC_ZP 00 */
    case 0xcb9f: pc=(carry)?52131:52129; break; /* BCS 02 */
    case 0xcba1: a=0; pc=52131; break; /* LDA_IMM 00 */
    case 0xcba3: m[203]=a; pc=52133; break; /* STA_ZP cb */
    case 0xcba5: a=m[1]; pc=52135; break; /* LDA_ZP 01 */
    case 0xcba7: carry=(a>=58); pc=52137; break; /* CMP_IMM 3a */
    case 0xcba9: pc=(!carry)?52150:52139; break; /* BCC 0b */
    case 0xcbab: a=m[203]; pc=52141; break; /* LDA_ZP cb */
    case 0xcbad: carry=(a>=58); pc=52143; break; /* CMP_IMM 3a */
    case 0xcbaf: pc=(carry)?52150:52145; break; /* BCS 05 */
    case 0xcbb1: a=8; pc=52147; break; /* LDA_IMM 08 */
    case 0xcbb3: if (a!=8) return -3; low++; pc=52150; /* external sfxPlayFuel trap */ break; /* JSR f5 cd */
    case 0xcbb6: if(sp<1) return -5; pc=ret[--sp]; break; /* RTS  */
    default: return -10;
  }
  return -11;
  done:
  o->fuel=m[0xcb]; o->camera_shake=(m[0xba]!=0);
  o->low_fuel_sfx=low; o->stone_sfx=stone;
  return 0;
}
