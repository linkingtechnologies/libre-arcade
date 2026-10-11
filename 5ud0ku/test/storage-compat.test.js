import fs from 'node:fs';
import {Grid,gridToBytes,gridFromBytes} from '../public/src/core/index.js';
const SOL='534678912672195348198342567859761423426853791713924856961537284287419635345286179',PUZ='530070000600195000098000060800060003400803001700020006060000280000419005000080079';
const g=new Grid('normal');for(let i=0;i<81;i++){const s=g.getSlot(Math.trunc(i/9),i%9),a=+SOL[i],sh=+PUZ[i];s.setAnswer(a);s.setShown(sh);s.setOriginalDigit(sh!==0);}g.setElapsedTime(1234567);g.setupPossibleDigits();g.getSlot(0,2).setPencilMark(8,true);
const actual=Buffer.from(gridToBytes(g)).toString('hex')+'\n',expected=fs.readFileSync(new URL('./fixtures/m3-java-save-normal.hex',import.meta.url),'utf8');
if(actual!==expected){console.error('FAIL | Java 1.8 save fixture mismatch');process.exit(1);}console.log('PASS | JS save is byte-for-byte identical to Java 1.8 fixture');
const restored=gridFromBytes(Buffer.from(expected.trim(),'hex'));if(Buffer.from(gridToBytes(restored)).toString('hex')!==expected.trim()){console.error('FAIL | Java fixture load/re-save mismatch');process.exit(1);}console.log('PASS | Java 1.8 save fixture loads and re-saves identically');
