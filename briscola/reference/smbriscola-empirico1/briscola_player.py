'''
    smBriscola: un semplice programma di simulazione del gioco della briscola
    Copyright (C) 2005  Massimo Masson

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

    FILES:
    gpl.txt
    gpl.it.txt

    CONTATTI:
    Massimo Masson
    Via Nogare`, 41
    32100 Belluno
    ITALY

    web:      http://smbriscola.sourceforge.net/
    e-mail:   mmasson@users.sourceforge.net
'''

try:
    #
    # Il comportamento normale e corretto consiste nell'importare
    # i moduli necessari dal framework
    #
    import smcarte.giocatore as giocatore
except:
    #
    # Per agevolare chi non vuole installare il framework, se questo non
    # risulta esistere proviamo a vedere se per caso sia stato copiato
    # tutto in un unica directory, e proviamo in questo modo
    # Se nemmeno questo funziona, non si va oltre.
    #
    import giocatore

import random

DEBUG = 0

class ErroreBriscola(Exception):
    pass

class giocatore_briscola(giocatore.giocatore):
    '''Definizione delle caratteristiche di un giocatore di briscola'''
    def __init__(self, metodo_gioco='Empirico1'):

        giocatore.giocatore.__init__(self)
        # Quale metodo si usa per giocare?
        # Di default quello del genitore...
        self.metodo_gioco = metodo_gioco
        # End of __init__()

    def Vince(self, briscola, carta1, carta2):
        '''Vero se carta1 vince su carta2, falso se carta1 perde su carta2'''
        #
        # su segni diversi vince il segno di briscola
        #

        if DEBUG: print "\n\n.Vince(briscola=", briscola.StampaCarta(0), ", carta1=", carta1.StampaCarta(0), ", carta2=", carta2.StampaCarta(0), ")"        
        
        if (carta1.seme.seme <> briscola.seme.seme) \
           and (carta2.seme.seme == briscola.seme.seme):

            if DEBUG: print "carta 1 non di briscola, carta 2 di briscola. carta 1 perde"
            
            return 0 # perde carta 1
        
        #
        # A parita' di segno vince chi ha piu' punti.
        # A parita' di punti vince chi ha la carta con
        # valore nominale maggiore.
        #
        # Questo caso vale tanto quanto entrambe le carte siano di briscola
        # quanto nel caso entrambe non lo siano, ma siano dello stesso segno
        #
        if carta1.seme.seme == carta2.seme.seme:
            # stesso seme

            if DEBUG: print "carte con lo stesso seme",
            
            if carta2.punti > carta1.punti:
                # la seconda carta ha piu' punti della prima

                if DEBUG: print "carta2 ha piu' punti. perde carta1"
            
                return 0 # perde carta 1

            if carta2.punti == carta1.punti:
                # le carte hanno lo stesso punteggio
                if carta2.valore > carta1.valore:
                    # La seconda carta ha lo stesso seme della prima, gli stessi
                    # punti, ma un valore nominale maggiore

                    if DEBUG: print "stessi punti, carta 2 vale piu' di carta 1. perde carta1"
                    
                    return 0 # perde carta 1
            
        # In via residuale, restano gli altri casi, per cui la vincente
        # e' la prima carta

        if DEBUG: print "vince carta 1"
        
        return 1
    
        # End of Vince()
        
    def ScegliCarta(self, tavolo):
        '''Sceglie la carta da giocare a briscola

        Ridefinizione del corrispondente metodo della classe da cui si
        eredita (polimorfismo).

        Se metodo e' vuoto, si utilizza il metodo ereditato (gioca a caso)

        Se metodo non e' vuoto, viene cercata una funzione del tipo:

        .ScegliCarta_metodo()

        dove a metodo viene sostituito il finale della funzione personalizzata.

        Se la funzione non esiste, si solleva un'eccezione.

        variando self.metodo si puo' quindi modificare il comportamento
        del giocatore automatico
        '''
        
        if self.metodo_gioco == '':
            # return self.ScegliCarta_Empirico1(tavolo)
            return giocatore.giocatore.ScegliCarta(self, tavolo)
        #
        # Si cerca il metodo richiesto...
        #
        if hasattr(self, "ScegliCarta_" + str(self.metodo_gioco) ):
            #
            # Se il metodo e' nel sorgente, deve essere nella forma
            # self.ScegliCarta_nome-metodo
            #
            funzione = getattr(self, "ScegliCarta_" + str(self.metodo_gioco) )
            return funzione(tavolo)
        else:
            try:
                #
                # Se il metodo di gioco non e' nel sorgente, si guarda nella
                # directory "autoplay" e si cerca una funzione con il nome
                # indicato. La sintassi in questo caso deve essere
                # nomefile.nomefunzione
                # Nella directory "autoplay" deve essere presente un file
                # di nome nomefile.py il quale deve contenere una funzione
                # di nome nomefunzione, la quale deve ricevere due parametri:
                # il primo e' il giocatore, il secondo il tavolo di gioco
                #
                (percorso, nome_funzione) = self.metodo_gioco.split('.')
                nome_modulo = "autoplay." + percorso
                raccolta = __import__(nome_modulo)
                modulo = getattr(raccolta, percorso)

                if hasattr(modulo, "ScegliCarta_" + nome_funzione):
                    funzione = getattr(modulo, "ScegliCarta_" + nome_funzione)
                    return funzione(self, tavolo)
                else:
                    raise ErroreBriscola
            except:
                raise ErroreBriscola
        # End of ScegliCarta()

    def ScegliCarta_Empirico1(self, tavolo):
        '''Metodo di gioco basato sull'esperienza di alcuni giocatori'''
        indice_carta = 0

        # print "INTELLIGENZA EMPIRICA 1: Aggan ciamento!"
        #if __debug__:
        #    for carta in self.carte:
        #        print carta.StampaCarta()

        #
        # Ad ogni carta si attribuisce un "peso", con il seguente criterio:
        # (Punti della carta) * 10 + valore nominale della carta
        # Se il segno e' di briscola, si aggiunge 1000.
        #
        # In questo modo le carte di briscola hanno peso > 1000,
        # mentre le carte non di briscola hanno peso < 1000
        # In particolare:
        #   Carta   Punti Val.Nomin.    Peso    Peso briscola
        #   2        0           2        2     1002
        #   4        0           4        4     1004
        #   5        0           5        5     1005
        #   6        0           6        6     1006
        #   7        0           7        7     1007
        #   Fante    2           8       28     1028
        #   Cavallo  3           9       39     1039
        #   Re       4          10       50     1050
        #   3       10           3      103     1103
        #   Asso    11           1      111     1111
        #
        pesi = []
        for c in self.carte:
            peso_carta = c.punti * 10 + c.valore
            # Seme di briscola? Dieta ingrassante istantanea di 1000.
            if c.seme.seme == tavolo.carta_di_briscola.seme.seme:
                peso_carta += 1000
            pesi.append(peso_carta)

        #
        # Ragionamento empirico1. Questa versione non ha "memoria"
        # delle carte uscite
        #
        # SE PRIMO DI MANO
        # ----------------
        # 1 - Se ne ho, gioco punti non di briscola
        # 2 - altrimenti gioco non punti, non di briscola
        # 3 - altrimenti gioco non punti, di briscola
        # 4 - altrimenti gioco punti di briscola
        # 5 - altrimenti gioco carichi non di briscola
        # 6 - altrimenti gioco carichi di briscola
        #
        # SE SECONDO DI MANO (RISPOSTA AD UNA CARTA)
        # ------------------------------------------
        # Se posso, vinco non usando una briscola
        #       in questo caso prendo con la carta piu' alta
        #       del seme in tavola
        # altrimenti posso vincere usando una briscola?
        #       se si, deve valerne la pena.
        #           sicuramente se c'e' un "carico"
        #           Se ci sono solo punti? BOH
        #           (Se non ci sono punti non ne vale la pena)
        # altrimenti perdo
        #   perdo senza punti non di briscola
        #   perdo con punti non di briscola
        #   perdo senza punti di briscola
        #   perdo con punti di briscola
        #   perdo con un carico non di briscola
        #   perdo con un carico di briscola
        #
        
        #
        # Si comincia a ragionare... empiricamente... *grinn*
        #
        if not tavolo.CarteInTavola():
            #
            # Primo di mano
            #
            
            # 1) Ho punti non di briscola? Se si gioco la piu' alta
            found = -1
            for indice in range(len(pesi)):
                # punti: peso tra 10 e 100
                peso = pesi[indice]
                if (peso>10) and (peso<100):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'alra. Quale vale di piu'?
                        if pesi[indice] > pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            # 2) Ho non punti, non di briscola? Se si gioco il valore nominale >
            found = -1
            for indice in range(len(pesi)):
                # non-punti, non di briscola: peso inferiore a 10
                peso = pesi[indice]
                if (peso<10):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'alra. Quale vale di piu'?
                        if self.carte[indice].valore > self.carte[found].valore:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            # 3) Ho non-punti, di briscola? Se si, gioco il valore nominale <
            found = -1
            for indice in range(len(pesi)):
                # non-punti, di briscola: peso tra 1000 e 1010
                peso = pesi[indice]
                if (peso>1000) and (peso<1010):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'alra. Quale vale di meno?
                        if self.carte[indice].valore < self.carte[found].valore:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            # 4) Ho punti di briscola? Gioco la piu bassa
            found = -1
            for indice in range(len(pesi)):
                # punti, di briscola: peso tra 1010 e 1100
                peso = pesi[indice]
                if (peso>1010) and (peso<1100):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'alra. Quale vale di meno?
                        if pesi[indice] < pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            # 5) Ho carichi non di briscola? Gioco la > (NON i 3 per primo)
            found = -1
            for indice in range(len(pesi)):
                # carichi, non di briscola: peso tra 100 e 1000
                peso = pesi[indice]
                if (peso>100) and (peso<1000):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'alra. Quale vale di piu'?
                        if pesi[indice] > pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]
            
            # 6) Ho carichi di briscola? Sigh... gioco la piu' bassa...
            found = -1
            for indice in range(len(pesi)):
                # carichi, di briscola: peso oltre 1100
                peso = pesi[indice]
                if (peso>1100):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'alra. Quale vale di meno?
                        if pesi[indice] < pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            # Qui non dovrei arrivarci, ma se ci arrivo gioco a caso...
            # ...forse dovrei sollevare un errore...?
            found = random.choice(self.carte)
            return self.carte[ found ]
        
        else:
            #
            # Risposta
            #
            carta_giocata = tavolo.carte[0]

            if DEBUG: print "in tavola:", carta_giocata.StampaCarta(0)
            
            # 1) Posso vincere senza usare una briscola? Se si uso la >
            if carta_giocata.seme.seme <> tavolo.carta_di_briscola.seme.seme:
                found = -1

                if DEBUG: print "Posso vincere senza usare una briscola?"
                
                for indice in range(len(pesi)):
                    
                    if DEBUG: print "esamino carta ", indice
                    
                    #print "nessuna carta di briscola in gioco..."
                    #print "Tra", carta_giocata.StampaCarta(),
                    #print "e", self.carte[indice].StampaCarta(),
                    #if self.Vince(tavolo.carta_di_briscola, carta_giocata, self.carte[indice]):
                    #    print "Vince la prima:",
                    #else:
                    #    print "Perde la prima:",
                    #print self.carte[indice].StampaCarta()
                    #print
                    if not self.Vince(tavolo.carta_di_briscola, \
                                  carta_giocata, self.carte[indice]):
                        # non-briscola: peso sotto 1000
                        peso = pesi[indice]
                        if (peso<1000):
                            if found < 0:
                                # prima trovata
                                found = indice

                                if DEBUG: print "computer puo' vincere con", self.carte[found].StampaCarta(0)
                                
                            else:
                                # Trovata ma ce n'era un'alra.
                                # Quale vale di piu'?

                                if DEBUG: print "computer puo' vincere con", self.carte[indice].StampaCarta(0)
                                
                                if pesi[indice] > pesi[found]:
                                    found = indice
                if found >=0:

                    if DEBUG: print "computer risponde con", self.carte[found].StampaCarta(0)
                                
                    return self.carte[ found ]

            # 2) Posso vincere usando una briscola?
            #    Trovo la briscola piu' bassa che puo' vincere
            found = -1

            if DEBUG: print "Posso vincere usando una briscola?"
                
            for indice in range(len(pesi)):
                #print "nessuna carta di briscola in gioco..."
                #print "Tra", carta_giocata.StampaCarta()
                #print "e", self.carte[indice].StampaCarta(),
                #if self.Vince(tavolo.carta_di_briscola, carta_giocata, self.carte[indice]):
                #    print "Vince la prima:",
                #else:
                #    print "Perde la prima:",
                #print self.carte[indice].StampaCarta()
                #print
                if not self.Vince(tavolo.carta_di_briscola, \
                              carta_giocata, self.carte[indice]):
                    # briscola: peso sopra i 1000
                    peso = pesi[indice]
                    if (peso>1000):
                        if found < 0:
                            # prima trovata
                            found = indice
                        else:
                            # Trovata ma ce n'era un'alra.
                            # Quale vale di meno?
                            if pesi[indice] < pesi[found]:
                                found = indice
            if found >=0:
                #
                # C'e' una briscola che fa vincere la mano...
                #
                # 2.1) Ne vale la pena?
                
                # Se si prende un asso o un tre, ne vale di sicuro la pena
                if carta_giocata.punti >= 10:
                    return self.carte[ found ]

                # Se si prendono punti, ne vale la pena? BOH! Intanto prendo...
                if carta_giocata.punti > 0:
                    return self.carte[ found ]

                # Se con i punti di quella carta chi altro vince???
                # TODO
                
                # Se no non ne vale la pena... andiamo oltre e vediamo come
                # perdere con dignita'... :)

            # 3) Se non posso vincere perdo. Cerco di farlo dignitosamente...
            
            #   3.1 perdo senza punti, non di briscola, carta val.nom. >
            found = -1

            if DEBUG: print "devo perdere senza punti..."
                
            for indice in range(len(pesi)):
                # non-punti, non di briscola: peso inferiore a 10
                peso = pesi[indice]
                if (peso<10):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'alra. Quale vale di piu'?
                        if self.carte[indice].valore > self.carte[found].valore:
                            found = indice
            if found >=0:
                return self.carte[ found ]
            
            #   3.2 perdo con punti non di briscola, carta piu' bassa
            found = -1
            for indice in range(len(pesi)):
                # punti: peso tra 10 e 100
                peso = pesi[indice]
                if (peso>10) and (peso<100):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'alra. Quale vale di meno?
                        if pesi[indice] < pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            #   3.3 perdo senza punti, di briscola
            found = -1
            for indice in range(len(pesi)):
                # non-punti, di briscola: peso tra 1000 e 1010
                peso = pesi[indice]
                if (peso>1000) and (peso<1010):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'alra. Quale vale di meno?
                        if self.carte[indice].valore < self.carte[found].valore:
                            found = indice
            if found >=0:
                return self.carte[ found ]
            
            #   3.4 perdo con punti di briscola
            found = -1
            for indice in range(len(pesi)):
                # punti, di briscola: peso tra 1010 e 1100
                peso = pesi[indice]
                if (peso>1010) and (peso<1100):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'alra. Quale vale di meno?
                        if pesi[indice] < pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            #   3.5 perdo con un carico non di briscola, il < che ho
            found = -1
            for indice in range(len(pesi)):
                # carichi, non di briscola: peso tra 100 e 1000
                peso = pesi[indice]
                if (peso>100) and (peso<1000):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'alra. Quale vale di meno?
                        if pesi[indice] < pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            #   3.6 perdo con un carico di briscola. Il <. Che s##ga!
            found = -1
            for indice in range(len(pesi)):
                # carichi, di briscola: peso oltre 1100
                peso = pesi[indice]
                if (peso>1100):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'alra. Quale vale di meno?
                        if pesi[indice] < pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]
            
            #
            # Qui non ci dovrei mai arrivare. Se arrivo, va a caso... :(
            #
            print "###SEGNALAZIONE ANOMALIA F.EMPIRICA1 RISPOSTA CARTA###"
            indice_corrente = random.choice(self.carte)
            
        return self.carte[ indice_carta ]
        # End of ScegliCarta_Empirico1()

    def ScegliCarta_Empirico2(self, tavolo):
        '''Metodo di gioco basato sull'esperienza di altri giocatori'''
        
        indice_carta = 0

        # print "INTELLIGENZA EMPIRICA 1: Aggan ciamento!"
        #if __debug__:
        #    for carta in self.carte:
        #        print carta.StampaCarta()

        #
        # Ad ogni carta si attribuisce un "peso", con il seguente criterio:
        # (Punti della carta) * 10 + valore nominale della carta
        # Se il segno e' di briscola, si aggiunge 1000.
        #
        # In questo modo le carte di briscola hanno peso > 1000,
        # mentre le carte non di briscola hanno peso < 1000
        # In particolare:
        #   Carta   Punti Val.Nomin.    Peso    Peso briscola
        #   2        0           2        2     1002
        #   4        0           4        4     1004
        #   5        0           5        5     1005
        #   6        0           6        6     1006
        #   7        0           7        7     1007
        #   Fante    2           8       28     1028
        #   Cavallo  3           9       39     1039
        #   Re       4          10       50     1050
        #   3       10           3      103     1103
        #   Asso    11           1      111     1111
        #
        pesi = []
        for c in self.carte:
            peso_carta = c.punti * 10 + c.valore
            # Seme di briscola? Dieta ingrassante istantanea di 1000.
            if c.seme.seme == tavolo.carta_di_briscola.seme.seme:
                peso_carta += 1000
            pesi.append(peso_carta)

        #
        # Ragionamento empirico1. Questa versione non ha "memoria"
        # delle carte uscite
        #
        # SE PRIMO DI MANO
        # ----------------
        # 1 - Se ne ho, gioco non punti non di briscola
        # 2 - altrimenti gioco punti, non di briscola
        # 3 - altrimenti gioco non punti, di briscola
        # 4 - altrimenti gioco punti di briscola
        # 5 - altrimenti gioco carichi non di briscola
        # 6 - altrimenti gioco carichi di briscola
        #
        # SE SECONDO DI MANO (RISPOSTA AD UNA CARTA)
        # ------------------------------------------
        # Prima considerazione: vale la pena vincere solo se ci
        #        sono punti in gioco, altrimenti mi penalizzo 
        #        (c'e` un vantaggio ad essere secondo di mano)
        #
        # Se posso, vinco non usando una briscola
        #       in questo caso prendo con la carta piu' alta
        #       del seme in tavola, solo se il gioco mi porta
        #     almeno 2 punti, altrimenti cerco se posso lasciare
        #       senza perdere punti.
        # altrimenti posso vincere usando una briscola?
        #       se si, deve valerne la pena.
        #           sicuramente se c'e' un "carico"
        #           Se ci sono solo punti? BOH
        #           (Se non ci sono punti non ne vale la pena)
        # altrimenti perdo
        #   perdo senza punti non di briscola
        #   se devo perdere con svantaggio preferiso vincere
        #      senza vantaggio...
        #   perdo con punti non di briscola
        #   perdo senza punti di briscola
        #   perdo con punti di briscola
        #   perdo con un carico non di briscola
        #   perdo con un carico di briscola
        #
        
        #
        # Si comincia a ragionare... empiricamente... *grinn*
        #
        if not tavolo.CarteInTavola():
            #
            # Primo di mano
            #
            
            # 1) Ho non punti non di briscola? Se si gioco la piu' alta
            found = -1
            for indice in range(len(pesi)):
                # punti: peso tra 1 e 10
                peso = pesi[indice]
                if (peso>1) and (peso<10):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'altra. Quale vale di piu'?
                        if pesi[indice] > pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            # 2) Ho punti, non di briscola? Se si gioco il valore nominale <
            found = -1
            for indice in range(len(pesi)):
                # non-punti, non di briscola: peso inferiore a 10
                peso = pesi[indice]
                if (peso > 10) and (peso < 100):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'altra. Quale vale di piu'?
                        if self.carte[indice].valore < self.carte[found].valore:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            # 3) Ho non-punti, di briscola? Se si, gioco il valore nominale <
            found = -1
            for indice in range(len(pesi)):
                # non-punti, di briscola: peso tra 1000 e 1010
                peso = pesi[indice]
                if (peso>1000) and (peso<1010):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'altra. Quale vale di meno?
                        if self.carte[indice].valore < self.carte[found].valore:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            # 4) Ho punti di briscola? Gioco la piu bassa
            found = -1
            for indice in range(len(pesi)):
                # punti, di briscola: peso tra 1010 e 1100
                peso = pesi[indice]
                if (peso>1010) and (peso<1100):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'altra. Quale vale di meno?
                        if pesi[indice] < pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            
            # 5) Ho carichi di briscola? Sigh... gioco la piu' alta...
            #    qui stai giocando senza memoria... se ti giochi il 3 
            #    e c'e` l'asso dall'altra parte?

            found = -1
            tre = -1
            asso = -1
            for indice in range(len(pesi)):
                # carichi, di briscola: peso oltre 1100
                peso = pesi[indice]
                if (peso>1100):
                    if found < 0:
                        # prima trovata
                        found = indice
                        if pesi[indice]==1103:
                            tre=indice
                        else:
                            asso=indice
                    else:
                        # trovata ma ce n'era un'altra. Quale vale di meno?
                        if pesi[indice]<pesi[found]:
                            found=indice
                        if pesi[indice]==1103:
                            tre=indice
                        else:
                            asso=indice
            if found >=0:
                if (tre>-1 and asso>-1) or (tre>-1 and tavolo.carta_di_briscola.punti==11):
                    return self.carte[ found ]
                elif asso > -1:
                    return self.carte[ asso ]
                
            # 6) Ho carichi non di briscola? Gioco la > (NON i 3 per primo)
            found = -1
            for indice in range(len(pesi)):
                # carichi, non di briscola: peso tra 100 e 1000
                peso = pesi[indice]
                if (peso>100) and (peso<1000):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'altra. Quale vale di piu'?
                        if pesi[indice] > pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]
            
            # Qui non dovrei arrivarci, ma se ci arrivo prendo sempre la n.0...
            # ...forse dovrei sollevare un errore...?
            #found = random.choice(self.carte)
            return self.carte[0]
        
        else:
            #
            # Risposta
            #
            carta_giocata = tavolo.carte[0]
            sceltapossibile1=-1
            sceltapossibile2=-1

            # 1) Posso vincere senza usare una briscola? Se si uso la >
            if carta_giocata.seme.seme <> tavolo.carta_di_briscola.seme.seme:
                found = -1
                
                for indice in range(len(pesi)):
                    #print "nessuna carta di briscola in gioco..."
                    #print "Tra", carta_giocata.StampaCarta(),
                    #print "e", self.carte[indice].StampaCarta(),
                    #if self.Vince(tavolo.carta_di_briscola, carta_giocata, self.carte[indice]):
                    #    print "Vince la prima:",
                    #else:
                    #    print "Perde la prima:",
                    #print self.carte[indice].StampaCarta()
                    #print
                    if not self.Vince(tavolo.carta_di_briscola, \
                                  carta_giocata, self.carte[indice]):
                        # non-briscola: peso sotto 1000
                        peso = pesi[indice]
                        if (peso<1000):
                            if found < 0:
                                # prima trovata
                                found = indice
                            else:
                                # Trovata ma ce n'era un'alra.
                                # Quale vale di piu'?
                                if pesi[indice] > pesi[found]:
                                    found = indice
                if found >=0:
                    if (self.carte[found].punti>0) or (carta_giocata.punti>0):
                        return self.carte[ found ]
                    else:
                        sceltapossibile1=found

            # 2) Posso vincere usando una briscola?
            #    Trovo la briscola piu' bassa che puo' vincere
            found = -1
            numerobriscole=0
            for indice in range(len(pesi)):
                #print "nessuna carta di briscola in gioco..."
                #print "Tra", carta_giocata.StampaCarta()
                #print "e", self.carte[indice].StampaCarta(),
                #if self.Vince(tavolo.carta_di_briscola, carta_giocata, self.carte[indice]):
                #    print "Vince la prima:",
                #else:
                #    print "Perde la prima:",
                #print self.carte[indice].StampaCarta()
                #print
                if not self.Vince(tavolo.carta_di_briscola, \
                              carta_giocata, self.carte[indice]):
                    # briscola: peso sopra i 1000
                    peso = pesi[indice]
                    if (peso>1000):
                        if found < 0:
                            # prima trovata
                            found = indice
                            numerobriscole=numerobriscole+1
                        else:
                            # Trovata ma ce n'era un'alra.
                            # Quale vale di meno?
                            numerobriscole=numerobriscole+1
                            if pesi[indice] < pesi[found]:
                                found = indice
            if found >=0:
                #
                # C'e' una briscola che fa vincere la mano...
                #
                # 2.1) Ne vale la pena?
                
                # Se si prende un asso o un tre, ne vale di sicuro la pena
                if carta_giocata.punti >= 10:
                    return self.carte[ found ]

                # Se si prendono punti, ne vale la pena? BOH! Intanto prendo...
                # 
                
                if carta_giocata.punti >= 2 and pesi[found] < 1100:
                    return self.carte[ found ]
                
                sceltapossibile2=found
                
                # Se con i punti di quella carta chi altro vince???
                # TODO
                
                # Se no non ne vale la pena... andiamo oltre e vediamo come
                # perdere con dignita'... :)

            # 3) Se non posso vincere perdo. Cerco di farlo dignitosamente...
            #   3.1 perdo senza punti, non di briscola, carta val.nom. >
            
            found = -1
            for indice in range(len(pesi)):
                # non-punti, non di briscola: peso inferiore a 10
                peso = pesi[indice]
                if (peso<10):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'altra. Quale vale di piu'?
                        if self.carte[indice].valore > self.carte[found].valore:
                            found = indice
            if found >=0:
                return self.carte[ found ]
            
            # piuttosto di buttar via punti prendo 0
            if sceltapossibile1 >= 0:
                return self.carte[ sceltapossibile1 ]

            #   3.2 perdo con punti non di briscola, carta piu' bassa
            found = -1
            
            for indice in range(len(pesi)):
                # punti: peso tra 10 e 100
                peso = pesi[indice]
                if (peso>10) and (peso<100):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'altra. Quale vale di meno?
                        if pesi[indice] < pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            #   3.3 perdo senza punti, di briscola
            found = -1
            for indice in range(len(pesi)):
                # non-punti, di briscola: peso tra 1000 e 1010
                peso = pesi[indice]
                if (peso>1000) and (peso<1010):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'altra. Quale vale di meno?
                        if self.carte[indice].valore < self.carte[found].valore:
                            found = indice
            if found >=0:
                return self.carte[ found ]
            
            #   3.4 perdo con punti di briscola
            found = -1
            for indice in range(len(pesi)):
                # punti, di briscola: peso tra 1010 e 1100
                peso = pesi[indice]
                if (peso>1010) and (peso<1100):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'altra. Quale vale di meno?
                        if pesi[indice] < pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]
                
            # piuttosto di perdere punti da carico, gioco la briscola che mi
            # avanza. se c'e`
            
            if sceltapossibile2 >= 0:
                return self.carte[ sceltapossibile2 ]

            #   3.5 perdo con un carico non di briscola, il < che ho
            found = -1
            for indice in range(len(pesi)):
                # carichi, non di briscola: peso tra 100 e 1000
                peso = pesi[indice]
                if (peso>100) and (peso<1000):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'altra. Quale vale di meno?
                        if pesi[indice] < pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]

            #   3.6 perdo con un carico di briscola. Il <. Che s##ga!
            found = -1
            for indice in range(len(pesi)):
                # carichi, di briscola: peso oltre 1100
                peso = pesi[indice]
                if (peso>1100):
                    if found < 0:
                        # prima trovata
                        found = indice
                    else:
                        # trovata ma ce n'era un'altra. Quale vale di meno?
                        if pesi[indice] < pesi[found]:
                            found = indice
            if found >=0:
                return self.carte[ found ]
            
            #
            # Qui non ci dovrei mai arrivare. Se arrivo, va a caso... :(
            #
            print "###SEGNALAZIONE ANOMALIA F.EMPIRICA1 RISPOSTA CARTA###"
            indice_corrente = random.choice(self.carte)
            
        return self.carte[ indice_carta ]
        # End of ScegliCarta_Empirico2()
        
    
    # End of class giocatore_briscola
