// Generated from identified opcode ranges in Shiru's Lawn Mower ROM.
// NOT NESRecomp. External APU/SFX routines are trapped as observable events.
#include <stdint.h>
#include <stdio.h>
typedef struct { int fuel, camera_shake, low_fuel_sfx, stone_sfx; } StoneResult;
int stone_run(unsigned initial, StoneResult *o) {
  uint8_t m[256]={0}, a=0; int carry=0,low=0,stone=0;
  uint16_t ret[3]; int sp=0;
  unsigned pc=0x8b6b;
  m[0xcb]=(uint8_t)initial;
  for(int steps=0;steps<100;steps++) switch(pc) {
    case 0x8b6b: a=1; pc=35693; break; /* LDA_IMM 01 */
    case 0x8b6d: m[186]=a; pc=35695; break; /* STA_ZP ba */
    case 0x8b6f: a=77; pc=35697; break; /* LDA_IMM 4d */
    case 0x8b71: if (sp>=3)return -2; ret[sp++]=35700; pc=35731; break; /* JSR 93 8b */
    case 0x8b74: a=11; pc=35702; break; /* LDA_IMM 0b */
    case 0x8b76: if (a!=11)return -4; stone++; goto done; /* external sfxPlay trap */ break; /* JMP e8 8d */
    case 0x8b93: m[0]=a; pc=35733; break; /* STA_ZP 00 */
    case 0x8b95: a=m[203]; pc=35735; break; /* LDA_ZP cb */
    case 0x8b97: m[1]=a; pc=35737; break; /* STA_ZP 01 */
    case 0x8b99: carry=1; pc=35738; break; /* SEC  */
    case 0x8b9a: { int v=(int)a-(int)m[0]-(carry?0:1); carry=(v>=0); a=(uint8_t)v; pc=35740; } break; /* SBC_ZP 00 */
    case 0x8b9c: pc=(carry)?35744:35742; break; /* BCS 02 */
    case 0x8b9e: a=0; pc=35744; break; /* LDA_IMM 00 */
    case 0x8ba0: m[203]=a; pc=35746; break; /* STA_ZP cb */
    case 0x8ba2: a=m[1]; pc=35748; break; /* LDA_ZP 01 */
    case 0x8ba4: carry=(a>=58); pc=35750; break; /* CMP_IMM 3a */
    case 0x8ba6: pc=(!carry)?35763:35752; break; /* BCC 0b */
    case 0x8ba8: a=m[203]; pc=35754; break; /* LDA_ZP cb */
    case 0x8baa: carry=(a>=58); pc=35756; break; /* CMP_IMM 3a */
    case 0x8bac: pc=(carry)?35763:35758; break; /* BCS 05 */
    case 0x8bae: a=8; pc=35760; break; /* LDA_IMM 08 */
    case 0x8bb0: if (a!=8) return -3; low++; pc=35763; /* external sfxPlayFuel trap */ break; /* JSR f2 8d */
    case 0x8bb3: if(sp<1) return -5; pc=ret[--sp]; break; /* RTS  */
    default: return -10;
  }
  return -11;
  done:
  o->fuel=m[0xcb]; o->camera_shake=(m[0xba]!=0);
  o->low_fuel_sfx=low; o->stone_sfx=stone;
  return 0;
}
