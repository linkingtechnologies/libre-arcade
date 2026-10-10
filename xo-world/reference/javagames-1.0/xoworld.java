/*-----------------------------------------------------------------------------
Copyright 2000-2007 Milan Babuskov

This file is part of JavaGames (http://javagames.sourceforge.net).

JavaGames is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

JavaGames is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with JavaGames in file COPYING; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
-----------------------------------------------------------------------------*/
import java.lang.*;
import java.awt.Image;
import java.awt.Graphics;
import java.awt.Color;
import java.awt.Event;
import java.awt.MediaTracker;
import java.applet.Applet;
/* ---------------------------------------------------------------------------
    Please note that the initial version was written in C and in Serbian
    language. A lot of code is just copy/pasted and left like that.
    This code probably not the example you'd want to learn Java from.
*/
public class xoworld extends Applet
{
    static final int DUBINA = 7;
    static final int NONE = 100;    /* ako nema trazene kombinacije */
    static final int TACNO = 1;
    static final int NETACNO = 0;
    static final int znakO = 2;
    static final int znakX = 1;
    static final int SAFE = 1;
    static final int CLEAN = 3;
    static final int COUNT = 2;
    static final int SETFLAGS = 1;
    static final int CHECK = 0;

    MediaTracker tracker;

    // st = status
    //  0 = in-game
    //  1 = computer calculating move
    //  2 = won game
    //  3 = lost game
    int potez = -1,st = 0,LastMove = NONE;
    int brojac[] = new int[8];
    int t[][] = new int[3][100];
    int tr[][] = new int[7][100];
    int tp[]= new int[100];
    int tf[]= new int[100];     /* tabla za flagove */
    int p[]= new int[10];       /* pomocni niz: funkcije salju brojeve opasnih polja */

    public void trtotp(int dub)
    {
        for (int k=0;k<100;k++)
            tp[k]=tr[dub][k];
    }
    public void tptotr(int dub)
    {
        for (int k=0;k<100;k++)
            tr[dub][k]=tp[k];
    }

    public int check5(int znak,int x,int type)  /* type:SETFLAGS, CHECK, CLEAN */
    {
        int j,k,l;
        int mesto=0,mesto2=0;

        for (l=0;l<6;l++)
        {
            for (j=0;j<10;j++)      /* horiz & vert */
            {
                for (k=0;k<4;k++)
                    brojac[k]=0;
                for (k=0;k<5;k++)
                {
                         if (t[x][j*10+l+k] == znak) /* h */
                        brojac[0]++;
                         else if (t[x][j*10+l+k] == NETACNO)
                    {
                        mesto=10*j+l+k;
                        p[brojac[1]]=mesto;
                        brojac[1]++;
                    }
                    else
                        break;
                }
                if (brojac[0]==3 && brojac[1]==2)
                {
                    if (type==SETFLAGS)
                    {
                        tf[p[0]]=TACNO;
                        tf[p[1]]=TACNO;
                    }
                    if (type==CLEAN)
                        return p[0];
                }
                if (brojac[0]==4 && brojac[1]==1 && type==CHECK)
                    return mesto;

                for (k=0;k<5;k++)
                {
                         if (t[x][l*10+j+k*10] == znak)   /* v */
                        brojac[2]++;
                         else if (t[x][l*10+j+k*10] == NETACNO)
                    {
                        mesto=10*l+j+k*10;
                        p[brojac[3]]=mesto;
                        brojac[3]++;
                    }
                    else
                        break;
                }
                if (brojac[2]==3 && brojac[3]==2)
                {
                    if (type==SETFLAGS)
                    {
                        tf[p[0]]=TACNO;
                        tf[p[1]]=TACNO;
                    }
                    if (type==CLEAN)
                        return p[0];
                }
                if (brojac[2]==4 && brojac[3]==1 && type==CHECK)
                    return mesto;
            }
            for (j=0;j<6;j++)
            {
                for (k=0;k<4;k++)           /* za diag */
                    brojac[k]=0;
                for (k=0;k<5;k++)                   /* diag\ */
                {
                         if ( t[x][l*10+j+k*11] == znak )
                        brojac[0]++;
                         if ( t[x][l*10+j+k*11] == NETACNO )
                    {
                        mesto=l*10+j+k*11;
                        p[brojac[1]]=mesto;
                        brojac[1]++;
                    }
                         if ( t[x][l*10 + j - k*9 + 40] == znak )   /* diag/ */
                        brojac[2]++;
                         if ( t[x][l*10 + j - k*9 + 40] == NETACNO )
                    {
                        mesto2 = l*10 + j - k*9 + 40;
                        p[brojac[3]]=mesto2;
                        brojac[3]++;
                    }
                }
                if (brojac[0]==3 && brojac[1]==2)
                {
                    if (type==SETFLAGS)
                    {
                        tf[p[0]]=TACNO;
                        tf[p[1]]=TACNO;
                    }
                    if (type==CLEAN)
                        return p[0];
                }
                if (brojac[0]==4 && brojac[1]==1 && type==CHECK)
                    return mesto;
                if (brojac[2]==3 && brojac[3]==2)
                {
                    if (type==SETFLAGS)
                    {
                        tf[p[0]]=TACNO;
                        tf[p[1]]=TACNO;
                    }
                    if (type==CLEAN)
                        return p[0];
                }
                if (brojac[2]==4 && brojac[3]==1 && type==CHECK)
                    return mesto2;
            }
        }
        return (NONE);
    }

     public int countc4(int znak,int x,int type) /* type:SAFE ili CLEAN */
    {
        int j,k,l;
        int zbir=0;
      int flag,flag2;

        flag=NETACNO;
        for (j=0;j<10;j++)
        {
            for (l=0;l<6;l++)       /* horiz */
            {
                brojac[0]=0;
                brojac[1]=0;
                brojac[2]=0;
                for (k=0;k<5;k++)
                         brojac[t[x][j*10+l+k]]++;        /* h */
                if (brojac[znak]==4 && brojac[NETACNO]==1)  /* found */
                {
                    if (type==SAFE)
                    {
                        flag2=NETACNO;
                        for (k=0;k<5;k++)
                        {
                                   if (t[x][j*10+l+k]==NETACNO && tf[j*10+l+k]==TACNO)     /* potez vodi u propast */
                            {
                                flag2=TACNO;    /* ne vazi se */
                            }
                        }
                        if (flag2==NETACNO)
                        {
                            zbir++;
                            flag=TACNO;
                            break;
                        }
                    }
                    else
                    {
                        zbir++;
                        flag=TACNO;
                        break;
                    }
                }
            }
            if (flag==TACNO)
                break;
        }
        flag=NETACNO;

        for (j=0;j<10;j++)
        {
            for (l=0;l<6;l++)       /* vert */
            {
                brojac[0]=0;
                brojac[1]=0;
                brojac[2]=0;
                for (k=0;k<5;k++)
                         brojac[t[x][l*10+j+k*10]]++;     /* v */
                if (brojac[znak]==4 && brojac[NETACNO]==1)
                {
                    if (type==SAFE)
                    {
                        flag2=NETACNO;
                        for (k=0;k<5;k++)
                                   if (t[x][l*10+j+k*10]==NETACNO && tf[l*10+j+k*10]==TACNO)    /* potez vodi u propast */
                                flag2=TACNO;    /* ne vazi se */
                        if (flag2==NETACNO)
                        {
                            zbir++;
                            flag=TACNO;
                            break;
                        }
                    }
                    else
                    {
                        zbir++;
                        flag=TACNO;
                        break;
                    }
                }
            }
            if (flag==TACNO)
                break;
        }
        flag=NETACNO;
        for (l=0;l<6;l++)
        {
            for (j=0;j<6;j++)
            {
                for (k=0;k<3;k++)           /* za diag */
                    brojac[k]=0;
                for (k=0;k<5;k++)                   /* diag\ */
                         brojac[t[x][l*10+j+k*11]]++;
                if (brojac[znak]==4 && brojac[NETACNO]==1)      /* found */
                {
                    if (type==SAFE)
                    {
                        flag2=NETACNO;
                        for (k=0;k<5;k++)
                        {
                                   if (t[x][l*10+j+k*11]==NETACNO && tf[l*10+j+k*11]==TACNO)    /* potez vodi u propast */
                            {
                                flag2=TACNO;    /* ne vazi se */
                            }
                        }
                        if (flag2==NETACNO)
                        {
                            zbir++;
                            flag=TACNO;
                            break;
                        }
                    }
                    else
                    {
                        zbir++;
                        flag=TACNO;
                        break;
                    }
                }
            }
            if (flag==TACNO)
                break;
        }
        flag=NETACNO;
        for (l=0;l<6;l++)
        {
            for (j=0;j<6;j++)
            {
                for (k=0;k<3;k++)           /* za diag */
                    brojac[k]=0;
                for (k=0;k<5;k++)
                         brojac[ t[x][ l*10 + j - k*9 + 40] ]++;    /* diag/ */
                if (brojac[znak]==4 && brojac[NETACNO]==1)
                {
                    if (type==SAFE)
                    {
                        flag2=NETACNO;
                        for (k=0;k<5;k++)
                        {
                                   if (t[x][l*10+j-k*9+40]==NETACNO && tf[l*10+j-k*9+40]==TACNO)     /* potez vodi u propast */
                            {
                                flag2=TACNO;    /* ne vazi se */
                            }
                        }
                        if (flag2==NETACNO)
                        {
                            zbir++;
                            flag=TACNO;
                            break;
                        }
                    }
                    else
                    {
                        zbir++;
                        flag=TACNO;
                        break;
                    }
                }
            }
            if (flag==TACNO)
                break;
        }
        return zbir;
    }

     public int check24c(int znak,int x)
    {
        int j,k,l;
        int mesto=0;

        for (j=0;j<100;j++)     /* kopira tablu */
               t[1][j]=t[x][j];

        for (k=0;k<100;k++)     /* prolazi celu tablu */
        {                       /* igra hipoteticki potez */
            if (t[1][k]==NETACNO)
            {
                t[1][k]=znak;
                if (countc4(znak,1,CLEAN) > 1)  /* ako ima double c4 */
                    return k;
                t[1][k]=NETACNO;    /* brise privremeni potez */
            }
        }
        return(NONE);
    }

     public int checko4c(int znak,int x,int type)     /* type:CHECK, SETFLAGS, COUNT, CLEAN */
    {
        int j,k,l;
        int mesto=0,mesto2=0;

        for (k=0;k<4;k++)
            p[k]=0;

        for (l=0;l<5;l++)
        {
            for (j=0;j<10;j++)      /* horiz */
            {
                for (k=0;k<4;k++)
                    brojac[k]=0;
                    if (t[x][j*10+l]==NETACNO && t[x][j*10+l+5]==NETACNO)
                {
                    for (k=1;k<5;k++)
                    {
                              if (t[x][j*10+l+k] == znak)
                            brojac[0]++;
                              else if (t[x][j*10+l+k] == NETACNO)
                        {
                            mesto=10*j+l+k;
                            brojac[1]++;
                        }
                        else
                            break;
                    }
                    if (type!=CLEAN && brojac[0]==3 && brojac[1]==1)
                    {
                        p[0]=1;
                        if (type==CHECK)
                            return mesto;
                        if (type==SETFLAGS)
                            tf[mesto]=TACNO;
                    }
                    if (type==CLEAN && brojac[0]==2 && brojac[1]==2)
                        return mesto;
                }

                    if (t[x][l*10+j]==NETACNO && t[x][l*10+j+50]==NETACNO)
                {
                    for (k=1;k<5;k++)
                    {
                              if (t[x][l*10+j+k*10] == znak)   /* vert */
                            brojac[2]++;
                              else if (t[x][l*10+j+k*10] == NETACNO)
                        {
                            mesto=10*l+j+k*10;
                            brojac[3]++;
                        }
                        else
                            break;
                    }
                    if (type!=CLEAN && brojac[2]==3 && brojac[3]==1)
                    {
                        p[1]=1;
                        if (type==CHECK)
                            return mesto;
                        if (type==SETFLAGS)
                            tf[mesto]=TACNO;
                    }
                    if (type==CLEAN && brojac[2]==2 && brojac[3]==2)
                        return mesto;
                }
            }
            for (j=0;j<5;j++)
            {
                for (k=0;k<4;k++)           /* za diag */
                    brojac[k]=0;
                    if (t[x][l*10+j]==NETACNO && t[x][l*10+j+55]==NETACNO)
                {
                    for (k=1;k<5;k++)                   /* diag\ */
                    {
                              if ( t[x][l*10+j+k*11] == znak)
                            brojac[0]++;
                              if ( t[x][l*10+j+k*11] == NETACNO )
                        {
                            mesto=l*10+j+k*11;
                            brojac[1]++;
                        }
                    }
                    if (type!=CLEAN && brojac[0]==3 && brojac[1]==1)        /* win */
                    {
                        p[2]=1;
                        if (type==CHECK)
                            return mesto;
                        if (type==SETFLAGS)
                            tf[mesto]=TACNO;
                    }
                    if (type==CLEAN && brojac[0]==2 && brojac[1]==2)
                        return mesto;
                }
                    if (t[x][l*10+j+50]==NETACNO && t[x][l*10+j+5]==NETACNO)
                {
                    for (k=1;k<5;k++)
                    {
                              if ( t[x][l*10+j-k*9+50] == znak)     /* diag/ */
                            brojac[2]++;
                              if ( t[x][l*10+j-k*9+50] == NETACNO )
                        {
                            mesto=l*10+j-k*9+50;
                            brojac[3]++;
                        }
                    }
                    if (type!=CLEAN && brojac[2]==3 && brojac[3]==1)
                    {
                        p[3]=1;
                        if (type==CHECK)
                            return mesto;
                        if (type==SETFLAGS)
                            tf[mesto]=TACNO;
                    }
                    if (type==CLEAN && brojac[2]==2 && brojac[3]==2)
                        return mesto;
                }
            }
        }
        if (type==COUNT)
        {
            k=p[0]+p[1]+p[2]+p[3];
            return k;
        }
        return (NONE);
    }


     public int checkc4o3(int znak,int x)
    {
        int k,l;
        int mesto=0;

        for (k=0;k<100;k++)
               t[1][k]=t[x][k];
        for (k=0;k<100;k++)     /* igra hipoteticki potez */
        {
            if (t[1][k]==NETACNO)   /* ako je polje slobodno    */
            {
                t[1][k]=znak;
                if (checko4c(znak,1,CHECK)!=NONE && countc4(znak,1,SAFE)>0)
                        return k;
                t[1][k]=NETACNO;
            }
        }
        return (NONE);
    }

    public void PostaviFlags(int znak)      /* funkcija dobija opasna polja od */
    {
        int k;

        for (k=0;k<100;k++)
            tf[k]=NETACNO;
        check5(znak,0,SETFLAGS);        /* oznacava rizicna polja */
        checko4c(znak,0,SETFLAGS);
    }

    public void setc4c(int znak)
    {
        int j,k,l;
      int po,x=2;

        for (j=0;j<100;j++)
            tp[j]=NETACNO;
                                    /*** closed 4 chances ***/
        /*** horizontal ***/

        for (j=0;j<10;j++)
        {
            for (k=0;k<6;k++)
            {
                brojac[0]=0;
                brojac[1]=0;
                for (l=0;l<5;l++)
                {
                         po=t[x][j*10+k+l];
                    if (po == znak)
                        brojac[0]++;
                    if (po == NETACNO)
                    {
                        p[brojac[1]]=j*10+k+l;
                        brojac[1]++;
                    }
                }
                if (brojac[0]==3 && brojac[1]==2)   /* nasao */
                    for (l=0;l<2;l++)           /* prazna!? polja */
                        tp[p[l]]=TACNO;
            }
        }

        /*** verical ***/

        for (j=0;j<10;j++)
        {
            for (k=0;k<6;k++)
            {
                brojac[0]=0;
                brojac[1]=0;
                for (l=0;l<5;l++)
                {
                         po=t[x][k*10+j+l*10];
                    if (po == znak)
                        brojac[0]++;
                    if (po==NETACNO)
                    {
                        p[brojac[1]]=k*10+j+l*10;
                        brojac[1]++;
                    }
                }
                if (brojac[0]==3 && brojac[1]==2)   /* nasao */
                    for (l=0;l<2;l++)           /* prazna!? polja */
                        tp[p[l]]=TACNO;
            }
        }

        /*** diagonal \ ***/

        for (j=0;j<6;j++)
        {
            for (k=0;k<6;k++)
            {
                brojac[0]=0;
                brojac[1]=0;
                for (l=0;l<5;l++)
                {
                         po=t[x][j*10+k+l*11];
                    if (po == znak)
                        brojac[0]++;
                    if (po==NETACNO)
                    {
                        p[brojac[1]]=j*10+k+l*11;
                        brojac[1]++;
                    }
                }
                if (brojac[0]==3 && brojac[1]==2)   /* nasao */
                    for (l=0;l<2;l++)           /* prazna!? polja */
                        tp[p[l]]=TACNO;
            }
        }

        /*** diagonal / ***/

        for (j=0;j<6;j++)
        {
            for (k=0;k<6;k++)
            {
                brojac[0]=0;
                brojac[1]=0;
                for (l=0;l<5;l++)
                {
                         po=t[x][j*10+k-l*9+40];
                    if (po == znak)
                        brojac[0]++;
                    if (po==NETACNO)
                    {
                        p[brojac[1]]=j*10+k-l*9+40;
                        brojac[1]++;
                    }
                }
                if (brojac[0]==3 && brojac[1]==2)   /* nasao */
                    for (l=0;l<2;l++)           /* prazna!? polja */
                        tp[p[l]]=TACNO;
            }
        }
    }

    public void seto4cc(int znak)
    {
        int j,k,l;
      int po;
      int x=2;

        for (j=0;j<100;j++)
            tp[j]=NETACNO;
                                    /*** open 3 chances ***/
                                    /* chances for open 4 chance */
        /*** horizontal ***/

        for (j=0;j<10;j++)
        {
            for (k=0;k<5;k++)
            {
                po=j*10+k;
                    if ( t[x][po]==NETACNO && t[x][po+5]==NETACNO )
                {
                    brojac[0]=0;
                    brojac[1]=0;
                    for (l=1;l<5;l++)
                    {
                              po=t[x][j*10+k+l];
                        if (po == znak)
                            brojac[0]++;
                        if (po==NETACNO)
                        {
                            p[brojac[1]]=j*10+k+l;
                            brojac[1]++;
                        }
                    }
                    if (brojac[0]==2 && brojac[1]==2)   /* nasao */
                        for (l=0;l<2;l++)   /* prazna!? polja */
                            tp[p[l]]=TACNO;
                }
            }
        }

        /*** verical ***/

        for (j=0;j<10;j++)
        {
            for (k=0;k<5;k++)
            {
                po=k*10+j;
                    if ( t[x][po]==NETACNO && t[x][po+50]==NETACNO)
                {
                    brojac[0]=0;
                    brojac[1]=0;
                    for (l=1;l<5;l++)
                    {
                              po=t[x][k*10+j+l*10];
                        if (po == znak)
                            brojac[0]++;
                        if (po==NETACNO)
                        {
                            p[brojac[1]]=k*10+j+l*10;
                            brojac[1]++;
                        }
                    }
                    if (brojac[0]==2 && brojac[1]==2)   /* nasao */
                        for (l=0;l<2;l++)   /* prazna!? polja */
                            tp[p[l]]=TACNO;
                }
            }
        }

        /*** diagonal \ ***/

        for (j=0;j<5;j++)
        {
            for (k=0;k<5;k++)
            {
                po=j*10+k;
                    if (t[x][po]==NETACNO && t[x][po+55]==NETACNO)
                {
                    brojac[0]=0;
                    brojac[1]=0;
                    for (l=1;l<5;l++)
                    {
                              po=t[x][j*10+k+l*11];
                        if (po == znak)
                            brojac[0]++;
                        if (po==NETACNO)
                        {
                            p[brojac[1]]=j*10+k+l*11;
                            brojac[1]++;
                        }
                    }
                    if (brojac[0]==2 && brojac[1]==2)   /* nasao */
                        for (l=0;l<2;l++)   /* prazna!? polja */
                            tp[p[l]]=TACNO;
                }
            }
        }

        /*** diagonal / ***/

        for (j=0;j<5;j++)
        {
            for (k=0;k<5;k++)
            {
                po=j*10+k;
                    if (t[x][po+50]==NETACNO && t[x][po+5]==NETACNO)
                {
                    brojac[0]=0;
                    brojac[1]=0;
                    for (l=1;l<5;l++)
                    {
                              po=t[x][j*10+k-l*9+50];
                        if (po == znak)
                            brojac[0]++;
                        if (po==NETACNO)
                        {
                            p[brojac[1]]=j*10+k-l*9+50;
                            brojac[1]++;
                        }
                    }
                    if (brojac[0]==2 && brojac[1]==2)   /* nasao */
                        for (l=0;l<2;l++)   /* prazna!? polja */
                            tp[p[l]]=TACNO;
                }
            }
        }
    }

     public int check2o3c(int znak,int x)
    {
        int k;

        for (k=0;k<100;k++)
        {
               if (t[x][k]!=NETACNO)
                continue;
               t[x][k]=znak;
               if (checko4c(znak,x,COUNT)>1)
                return k;
               t[x][k]=NETACNO;
        }
        return NONE;
    }

    public int checkIzmedju()
    {
        int k,l,x,y;

        // horiz & vert only
        for (k=1;k<7;k++)
        {
            for (l=1;l<9;l++)
            {
                x = k + 10 * l;
                y = l + k * 10;
                if (t[0][x]==znakX && t[0][x+2]==znakX && t[0][x+1]==0)
                    return (x+1);
                if (t[0][y]==znakX && t[0][y+20]==znakX && t[0][y+10]==0)
                    return (y+10);
            }
        }
        return NONE;
    }

    public int checkCross(int znak)
    {
        int k,l,x;

        for (k=1;k<7;k++)
        {
            for (l=1;l<7;l++)
            {
                x = k + 10 * l;
                if (t[0][x]==znak && t[0][x+2]==znak && t[0][x+20]==znak && t[0][x+22]==znak && t[0][x+11]==0)
                    return (x+11);
            }
        }
        return NONE;
    }

    public int checkBox(int znak)
    {
        for (int k=1;k<8;k++)
        {
            for (int l=1;l<8;l++)
            {
                int cnt = 0;
                int pos = -1;
                for (int a=0; a<2; a++)
                {
                    for (int b=0; b<2; b++)
                    {
                        int x = k + a + 10 * (l+b);
                        int c = t[0][x];
                        if (c == znak)
                            cnt++;
                        else if (c == 0)
                            pos = x;
                    }
                }
                if (cnt == 3 && pos != -1)
                    return pos;
            }
        }
        return NONE;
    }

    public int pobeda()     // provera da li je neko pobedio
    {
        int j,k,l;

        for (l=0;l<6;l++)
        {
            for (j=0;j<10;j++)      /* horiz & vert */
            {
                for (k=0;k<8;k++)
                    brojac[k]=0;
                for (k=0;k<5;k++)
                {
                         brojac[ t[0][j*10+l+k] ]++;        /* h */
                         brojac[4+t[0][l*10+j+k*10]]++;     /* v */
                }
                if (brojac[1]==5 || brojac[5]==5)       /* win */
                    return znakX;
                if (brojac[2]==5 || brojac[6]==5)
                    return znakO;
            }
            for (j=0;j<6;j++)
            {
                for (k=0;k<8;k++)           /* za diag */
                    brojac[k]=0;
                for (k=0;k<5;k++)                   /* diag\ */
                {
                         brojac[ t[0][l*10+j+k*11] ]++;
                         brojac[ 4+t[0][l*10+j-k*9+40] ]++;      /* diag/ */
                }
                if (brojac[1]==5 || brojac[5]==5)       /* win */
                    return znakX;
                if (brojac[2]==5 || brojac[6]==5)
                    return znakO;
            }
        }
        return (NETACNO);
    }

    Image SlikaX;       // slicice sa znakovima
    Image SlikaO,SlikaO2;
    Image Slika,pobed,poraz,plypotez,novaigra;

    // inicijalizacija - nacrtaj polja, nuliraj tabelu, itd
    public void init()
    {
        int k;
        byte c;
        tracker = new MediaTracker(this);

        for (k=0;k<100;k++)
            t[0][k]=0;
        SlikaX = getImage(getCodeBase(),"slikax.jpg");
        SlikaO = getImage(getCodeBase(),"slikao.jpg");
        SlikaO2 = getImage(getCodeBase(), "slikao2.jpg");
        Slika = getImage(getCodeBase(), "slika.jpg");
        pobed = getImage(getCodeBase(), "win.jpg");
        poraz = getImage(getCodeBase(), "loose.jpg");
        plypotez = getImage(getCodeBase(), "plyturn.jpg");
        novaigra = getImage(getCodeBase(), "newgame.jpg");

        tracker.addImage(SlikaX,0);
        tracker.addImage(SlikaO,0);
        tracker.addImage(SlikaO2,0);
        tracker.addImage(Slika,0);
        tracker.addImage(pobed,0);
        tracker.addImage(poraz,0);
        tracker.addImage(plypotez,0);
        tracker.addImage(novaigra,0);
    }

    public void run()
    {
        try         // ceka da se sve ucita
        {
            tracker.waitForAll();
        }
        catch (InterruptedException e)
        {
            return;
        }
    }

    public void paint(Graphics g)
    {
        if (potez==-1)
        {
            setBackground(Color.white);

            // ucitava slike unapred da bi sve islo glatko posle
            g.drawImage(pobed,   100,   0, this);
            g.drawImage(poraz,   100,   0, this);
            g.drawImage(plypotez,100,   0, this);
            for (int r = 0 ; r < 10 ; r++)
            {
                for (int c = 0 ; c < 10 ; c++)
                {
                    if (r == c)
                        g.drawImage(SlikaX, c*30, r*30+40, this);
                    else if (r == 0)
                        g.drawImage(SlikaO2, c*30, r*30+40, this);
                    else if (c == 0)
                        g.drawImage(SlikaO, c*30, r*30+40, this);
                    else
                        g.drawImage(Slika, c*30, r*30+40, this);
                }
            }
        }
        else
        {
            for (int r = 0 ; r < 10 ; r++)
            {
                for (int c = 0 ; c < 10 ; c++)
                {
                        if (t[0][r*10+c]==znakX)
                            g.drawImage(SlikaX, c*30, r*30+40, this);
                        else if (t[0][r*10+c]==znakO)
                        {
                               if (r*10+c==LastMove)
                                g.drawImage(SlikaO2, c*30, r*30+40, this);
                                else
                                g.drawImage(SlikaO, c*30, r*30+40, this);
                        }
                        else
                            g.drawImage(Slika, c*30, r*30+40, this);
                }
            }
        }

        g.drawImage(novaigra, 0, 0, this);
        if (st == 0)
            g.drawImage(plypotez,100,0,this);
        else if (st == 2)
            g.drawImage(pobed,100,0,this);
        else if (st == 3)
            g.drawImage(poraz,100,0,this);
        //else  TODO: show: THINKING or something like that
        //    g.drawImage(pobed,100,0,this);
    }

    public int OdigrajPotez(int znak,int x)     // igra ogrovor na hipoteticki potez
    {
        int mesto=0;

          if ( (mesto=check5(3-znak,x,CHECK)) != NONE)      /*** 5 PLY ***/
            return mesto;

          if ( (mesto=checko4c(3-znak,x,CHECK)) != NONE)    /*** open4chance PLY */
            return mesto;

        return(NONE);
    }

    public int checkSerie(int znak,int dub)
    {
        int k,odg;

        if (dub==DUBINA)
            return NONE;
        setc4c(znak);

        for (k=0;k<100;k++)
        {
            if (tp[k]==NETACNO || t[2][k]!=NETACNO)
                continue;
            tptotr(dub);
            t[2][k]=znak;
            odg=OdigrajPotez(3-znak,2);
            if (odg==NONE)              /* error */
                return NONE;
            t[2][odg]=3-znak;
            if (check5(znak,2,CHECK) != NONE)
                return k;
            if (check5(3-znak,2,CHECK) != NONE)
            {
                t[2][k]=NETACNO;
                t[2][odg]=NETACNO;
                trtotp(dub);        /* vrati tp[] na stare vrednosti */
                continue;
            }
            if (checkSerie(znak,dub+1) != NONE)
                return k;
            t[2][k]=NETACNO;
            t[2][odg]=NETACNO;
            trtotp(dub);        /* vrati tp[] na stare vrednosti */
        }
        return NONE;
    }

    public int igraj(int x,int y)       // vraca polje 0-99 gde zeli da odigra
    {                   // ili NONE za nijedno polje (NONE=100)
        int mesto=0,i,j,flag;

        if (potez==1)       // Prvi potez - podesi
        {
            if (y>5)
                return(y*10+x-11);
            else
                return(y*10+x+11);
        }

        if (potez == 2 && (mesto=checkIzmedju()) != NONE )  // ako ima X_X
            return mesto;

        if (potez > 3)
        {
            if ( (mesto=check5(znakO,0,CHECK)) != NONE)     /*** 5 CPU ***/
                return mesto;

            if ( (mesto=check5(znakX,0,CHECK)) != NONE)     /*** 5 PLY ***/
                return mesto;
        }

        if ( potez>2 && (mesto=checko4c(znakO,0,CHECK)) != NONE)    /*** open4chance CPU ***/
            return mesto;

        if ( potez>5 && (mesto=check24c(znakO,0)) != NONE)      /*** pot 2 x c4 CPU ***/
            return mesto;

        PostaviFlags(znakX);                // oznacava rizicna polja za CPU ***/

        if ( potez>4 && (mesto=checkc4o3(znakO,0)) != NONE) /*** pot CPU c4 & o3 ***/
            return mesto;

        if ( potez>2 && (mesto=checko4c(znakX,0,CHECK)) != NONE)    /*** open4chance PLY */
            return mesto;

        if ( potez>5 && (mesto=check24c(znakX,0)) != NONE)      /*** double c4 PLY ***/
            return mesto;

        PostaviFlags(znakO);
        if ( potez>4 && (mesto=checkc4o3(znakX,0)) != NONE) /*** ply c4 & o4c ***/
            return mesto;

        for (i=0; i<100;i++)        // copy t0 -> t2
            t[2][i]=t[0][i];

        if ( potez>3 && (mesto=checkSerie(znakO,0)) != NONE)
            return mesto;

        if ( potez>3 && (mesto=checkSerie(znakX,0)) != NONE)
            return mesto;

        if ( potez>2 && (mesto=check2o3c(znakO,0)) != NONE)
            return mesto;

        if ( potez>2 && (mesto=check2o3c(znakX,0)) != NONE)
            return mesto;

        if ( potez>3 && (mesto=checkCross(znakX)) != NONE)  // eliminise sablonsku pobedu
            return mesto;

        if ( potez>3 && (mesto=checkCross(znakO)) != NONE)  // pokusava sablonsku pobedu
            return mesto;

        if ( potez>2 && (mesto=checkBox(znakX)) != NONE) // eliminate pattern
            return mesto;

        if ( potez>2 && (mesto=checkIzmedju()) != NONE) // sprecava X_X => XXX
            return mesto;

        // ovde dodati jos neki potez za CPU

        // DUMMY defense    do kraja...

        seto4cc(znakX); // trazi 04cc X i oznaci opasna polja u tp
          for (i=11;i<89;i++)
            if (tp[i]==TACNO && (t[0][i-11]==znakX || t[0][i-10]==znakX || t[0][i-9]==znakX || t[0][i-1]==znakX || t[0][i+1]==znakX || t[0][i+9]==znakX || t[0][i+10]==znakX || t[0][i+11]==znakX))
                return i;

      if ( (mesto=checko4c(znakO,0,CLEAN)) != NONE) // pravi o4c O
        return mesto;

        if ( (mesto=check5(znakX,0,CLEAN)) != NONE)   // zatvara c4c X
            return mesto;

        i=NETACNO;
          // proveri ako je tabla puna
          //     onda i=TACNO, mesto=0
        do
        {
            mesto=(int)(Math.random() * 100);   /* rnd move */
            if (t[0][mesto]!=NETACNO)
                continue;
            if ( (mesto>0 && t[0][mesto-1]!=NETACNO) || (mesto>10 && (t[0][mesto-11]!=NETACNO || t[0][mesto-10]!=NETACNO || t[0][mesto-9]!=NETACNO)) || (mesto<99 && t[0][mesto+1]!=NETACNO) || (mesto<88 && (t[0][mesto+9]!=NETACNO || t[0][mesto+10]!=NETACNO || t[0][mesto+11]!=NETACNO)))
                i=TACNO;
        } while (i==NETACNO);
        return mesto;
    }

    public boolean mouseUp(Event evt, int x, int y)
    {
        if (y<40)           // click na opciju iznad
        {
            if (x<100)      // nova igra
            {
                for (int k=0;k<100;k++)
                    t[0][k]=0;
                potez=0;
                st=0;
                repaint();
            }
            return true;
        }

        // izracunaj koordinatu
        x=x/30;
        y=(y-40)/30;

        if ( t[0][y*10+x]!=NETACNO || st!=0 || potez>49)    // polje zauzeto ili gameover
        {
            // illegal move sfx
            return true;
        }
        potez++;
        t[0][y*10+x] = znakX;      //   ako je polje slobodno - nacrtaj X
        if (pobeda() == NETACNO)
        {
            //st=1;                   // draw image: PLEASE WAIT
            //repaint();
            LastMove=igraj(x,y);
            t[0][LastMove]=znakO;   // igra odgovor
            st=0;
        }

        if (pobeda()==znakO)        // CPU pobeda
            st=3;

        if (pobeda()==znakX)        // PLY pobeda
            st=2;

        repaint();
        return true;
    }
}



