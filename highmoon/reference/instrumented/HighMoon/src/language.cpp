/******************************************************************************************
 *
 * HighMoon - Duell im All Version 1.0
 * Copyright (c) 2005, 2006 Patrick Gerdsmeier <patrick@gerdsmeier.net>
 *
 * "language.cpp"
 * 
 *
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 *
 ******************************************************************************************/
#include <iostream>
#include <sstream>

#include "language.hpp"
#include "constants.hpp"

const int MAXLANGUAGES = 9;

Language::Language()
:
	language( LANG_ENGLISH )
{
	verbose( "Initializing Language" ); 
}

void Language::toggle()
{
	verbose( "Toggling Language" );

	language = Languagetype( (language + 1) % MAXLANGUAGES );
}

void Language::set( Languagetype language ) 
{
	verbose( "Setting Language" );

	this->language = Languagetype( language % MAXLANGUAGES );
}

void Language::set( char *language )
{
	verbose( "Setting Language to $LANG" );

	if ( language == NULL ) return;
	
	if ( !strncmp( language, 	"de", 2 ) ) set( LANG_GERMAN );

	else if ( !strncmp( language,	"fr", 2 ) ) set( LANG_FRENCH );

	else if ( !strncmp( language, 	"pl", 2 ) ) set( LANG_POLISH );

	else if ( !strncmp( language, 	"pt", 2 ) ) set( LANG_PORTUGUESE );

	else if ( !strncmp( language, 	"es", 2 ) ) set( LANG_SPANISH );

	else if ( !strncmp( language, 	"ru", 2 ) ) set( LANG_RUSSIAN );
	
	else if ( !strncmp( language, 	"it", 2 ) ) set( LANG_ITALIAN );

	else if ( !strncmp( language, 	"nl", 2 ) ) set( LANG_NETHERLAND );
}
	
char* Language::getWindowtext() const
{
	char* r[] = {
		"HighMoon - Duel in Space by Patrick Gerdsmeier",
		"HighMoon - Duell im All von Patrick Gerdsmeier",
		"HighMoon - Duel dans l'Univers de Patrick Gerdsmeier",
		"HighMoon - Przeciwnicy w Kosmosie od Patrick Gerdsmeier",
		"HighMoon - Duelo uo Universo de Patrick Gerdsmeier",
		"HighMoon - Duelo en el Espacio de Patrick Gerdsmeier",
		"HighMoon - Dy3^b B Kocmoce om Patrick Gerdsmeier",
		"HighMoon - Sfida nello Spazio di Patrick Gerdsmeier",
		"Highmoon - Duel in de Ruimte door Patrick Gerdsmeier"
	};

	return r[language];
}

std::string Language::getTitletext( int id ) const
{	
	const std::string r[][_TITLETEXT] = {
		{
			"HIGHMOON",
			"",
			"DUEL IN SPACE V"+VERSION,
			"2005, 2006",
			"BY PATRICK GERDSMEIER,",
			"PATRICK@GERDSMEIER.NET",
			"LICENSED UNDER THE GPL",
			"",
			"F1 FOR HELP",
			"F2 DEUTSCH"
		},

		{
			"HIGHMOON",
			"",
			"DUELL IM ALL V"+VERSION,
			"2005, 2006",
			"VON PATRICK GERDSMEIER,",
			"PATRICK@GERDSMEIER.NET",
			"LIZENSIERT UNTER DER GPL",
			"",
			"F1 FUER HILFE",
			"F2 FRANgAIS"	
		},

		{
			"HIGHMOON",
			"",
			"DUEL DANS L'UNIVERS V"+VERSION,
			"2005, 2006",
			"DE PATRICK GERDSMEIER,",
			"PATRICK@GERDSMEIER.NET",
			"LICENCE SOUS LE GPL",
			"",
			"F1 POUR L'AIDE",
			"F2 POLSKI"
		},

		{
			"HIGHMOON",
			"",
			"PRZECIWNICY W KOSMOSIE V"+VERSION,
			"2005, 2006",
			"OD PATRICK GERDSMEIER,",
			"PATRICK@GERDSMEIER.NET",
			"POD LICENCJa GPL",
			"",
			"F1 POMOC",
			"F2 PORTUGUESE"
		},

		{
			"HIGHMOON",
			"",
			"DUELO UO UNIVERSO V"+VERSION,
			"2005, 2006",
			"DE PATRICK GERDSMEIER,",
			"PATRICK@GERDSMEIER.NET",
			"LICENgA A BAIXO DE GPL",
			"",
			"F1 PARA AJUDA",
			"F2 ESPA|OL"
		},
		
		{
			"HIGHMOON",
			"",
			"DUELO EN EL ESPACIO V"+VERSION,
			"2005, 2006",
			"DE PATRICK GERDSMEIER,",
			"PATRICK@GERDSMEIER.NET",
			"CONTRATO DE LICENCIA BAJO GPR",
			"",
			"F1 PARA AYUDA",
			"F2 PYCCKnm"
		},
	
		{
			"HIGHMOON",
			"",
			"DY}lw B KOCMOCE V"+VERSION,
			"2005, 2006",
			"OM pATPnKA nkAHOknsA {EPyCMAEPA,",
			"PATRICK@GERDSMEIER.NET",
			"lnzEH}nA Y {pl",
			"",
			"F1 pOMOvw",
			"F2 ITALIANO"
		},
        
        {
			"HIGHMOON",
			"",
			"SFIDA NELLO SPAZIO V"+VERSION,
			"2005, 2006",
			"DI PATRICK GERDSMEIER,",
			"PATRICK@GERDSMEIER.NET",
			"RILASCIATO CON LICENZA GPL",
			"",
			"F1 AIUTO",
			"F2 NEDERLANDS"
		},
		
		{
			"HIGHMOON",
			"",
			"DUEL IN DE RUIMTE V"+VERSION,
			"2005, 2006",
			"DOOR PATRICK GERDSMEIER,",
			"PATRICK@GERDSMEIER.NET",
			"DE LICENTIE IS GPL",
			"",
			"F1 VOOR HELP",
			"F2 ENGLISH"
		}
	};
	
	return r[language][id];
}

std::string Language::getScrollertext() const
{	
	const std::string r[] = {
		"THE KEYS 1, 2 AND 3 FOR MODE OF GAME - "
		"TAB CHANGES THE GALAXY - "
		"CURSOR LEFT AND RIGHT TO SET THE SHOOTANGLE - "
		"CURSOR UP AND DOWN TO MOVE THE SPACESHIP - "
		"KEEP SPACE PRESSED TO INCREASE SHOOTPOWER - RELEASE SPACE TO FIRE - "
		"RETURN TO BUY WEAPONS OR SHIELDPOWER - "
		"F TOGGLES WINDOW AND FULLSCREEN MODE. "
		"C TOGGLES COMPUTERSTRENGTH 1..5.   "
		"HIGHMOON THE DUEL IN SPACE WAS WRITTEN IN 2005 BY PATRICK GERDSMEIER AND IS LICENSED UNDER THE GPL.   "
		"HAVE FUN!   DEDICATED TO ULI     ",

		"DIE TASTEN 1, 2 UND 3 FUER SPIELMODUS - "
		"TAB WECHSELT DIE GALAXIE - "
		"CURSOR LINKS UND RECHTS STELLT DEN SCHUSSWINKEL EIN - "
		"CURSOR OBEN UND UNTEN BEWEGEN DAS UFO - "
		"LEERTASTE GEDRUECKT LASSEN ZUM ERHOEHEN DER SCHUSSSTAERKE - LEERTASTE LOSLASSEN ZUM FEUERN - "
		"RETURN ZUM KAUFEN VON WAFFEN UND SCHILDSTAERKE - "
		"F WECHSELT ZWISCHEN FENSTER UND FULLSCREEN MODUS. "
		"C WECHSELT DIE COMPUTERSTAERKE 1..5.   "
		"HIGHMOON DAS DUELL IM ALL WURDE GESCHRIEBEN 2005 VON PATRICK GERDSMEIER UND IST LIZENSIERT UNTER DER GPL.   VIEL SPASS!   "
		"GEWIDMET MEINER ULI     ",

		"LES CLiS 1, 2 ET 3 POUR MODE DU JEU - "
		"LE TABULATEUR CHANGE LA GALAXIE - "
		"CURSEUR h GAUCHE ET DROITE PLACES L'ANGLE DU TIR - "
		"CURSEUR EN HAUT ET VERS LE BAS DiPLACER L'UFO - "
		"LA CLi LAISSER AUGMENTE PiNIBLE LE POUVOIR DU TIR - "
		"CLi LIBEiRER VISANT ALIMENTER - "
		"LE F CHANGE FENiTRE-IMAGE PLEINE. "
		"LE C CHANGE LE POUVOIR DE L'ORDINATEUR 1..5.   "
		"HIGHMOON LE DUEL DANS L'UNIVERS 2005 DE PATRICK GERDSMEIER 2005. LICENCE SOUS LE GPL.   "
		"BEAUCOUP D'AMUSEMENT!    POUR MA ULI     ",
		
		"WYBdR RODZAJU GRY 1, 2, 3 - "
		"TABULATOR ZMIENIA GALAKTYKb - "
		"KURSOR LEWY IPRAWY DO USTAWIENIA KaTA STRZEcU - "
		"KURSOR GdRA, Ddc PORUSZA UFO - "
		"PRZYTRZYMANIE SPACJI OKREeLA SIcb STRZAcU - "
		"F ZMIEWIA ROZMIAR OKNA. "
		"C ZMIAWA POZIOMUTRUDNOSCI 1..5.   "
		"HIGHMOON PRZECIWNICY W KOSMOSIE. NAPISANE PRZEZ PATRICK GERDSMEIER LUTY 2005. POD LICENCJa GPL. DUfo PRZYJEMNOeCI!   ",

		"AS TECLAS 1, 2, 3 PARA OS MODOS DA JOGO - "
		"TABULATOR TROCA DE GALAXIA - "
		"CURSOR ESQUERDO E DIREITO PARA O ANGULO DE ALVO - "
		"CURSOR BAIXO E ALTO MOVE O UFO - "
		"ESPAgO DEIXO POLUSADO PARA FAZER A ALVO MAIS FORTE - "
		"DEIXA ESPAQO PARA ATIRAR - "
		"F TROCA ENTRE JANELA E MODO DE ABERTURA. "
		"C TROCA A FORgA DO COMPUTATOR 1..5.   "
		"HIGHMOON O DUELO UO UNIVERSO ESTAVA ESCRIVENDO 2005 DE PATRICK GERDSMEIER 2005. LICENga A BAIXO DE GPL.   "
		"BOA DIVERSAOhO!   DEDICATdRIA PARA MINHA ULI     ",
		
		"LAS TECLAS 1, 2 Y 3 AREGLAN EL MODO DEL JUEGO - "
		"CON TAB CAMBIA LA GALAXIA - "
		"LAS FLECHAS ISQUIERDA Y DERECHA PARA ELEGIR EL ANGULO DEL DISPARO - "
		"CON LAS FLECHAS ABAJO Y ARRIBA SE MUEVA LA NAVE ESPACIAL - "
		"ESPACIADOR APRETADO SUBE LA POTENCIA DEL DISPARO - "
		"SOLTAR EL ESPACIADOR PARA DISPARAR - "
		"SOLTANDO LA TECLA DE ENTRADA PARA COMPRAR PROTECION O OTRAS ARMAS - "
		"CON F CAMBIA VENTANA O AL MODO PANTALLA COMPLETO. "
		"CON C CAMBIA LA ESFUERZA DEL ORDENADOR DE1..A5.   "
		"HIGHMOON EL DUELO EN EL ESPACIO FUE ESCRITO EN 2005 DE PATRICK GERDSMEIER"
		"Y EL JUEGO ES LICENCADO BAJO DE GPR.   "
		"MUCHA SUERTE!   "
		"DEDICADO A ULI     ",

		"snClO nPAKOB 1, 2, 3 - "
		"TAB >lR n}MEHEHnr {AlAKTnKn - "
		"CURSOR lEBnm n pPABwIm YCTAHABlrE Y{Ol BwICTPElA - "
		"CURSOR BBEPX n BHU} Ylr YpPABlEHnr KOPAklEM HlO - "
		"SPACE HAYABlEHOm OCTABnTw YTOkwI YCTAHOBnTw CnlY BwICTPElA - "
		"F MEHrET PA}MEP OKHA. "
		"C MEHrET CnlY KOMpoTEPA 1..5.   "
		"HIGHMOON yY}lw B KOCMOCE. HApsCAHO pATPnKOM nkAHOknsA {EPyCMAEPA.     ",
		
		"USA I TASTI 1, 2 E 3 PER LE MODALITA' DI GIOCO - "
		"TAB PER CAMBIARE GALASSIA - "
		"CURSORE DESTRO E SINISTRO PER VARIARE L'ANGOLO DI TIRO - "
		"CURSORE SU E GIU' PER MUOVERE LA NAVETTA - "
		"TIENI PREMUTA LA BARRA SPAZIO PER INCREMENTARE LA POTENZA DELLO SPARO - RILASCIA PER SPARARE - "
		"USA INVIO PER ACQUISTARE ARMI O RINFORZARE LO SCUDO - "
		"F ALTERNA LA MODALITA' FINESTRA O SCHERMO INTERO. "
		"C VARIA L'ABILITA' DEL COMPUTER DA 1 A 5.   "
		"HIGHMOON : SFIDA NELLO SPAZIO E' STATO CREATO NEL 2005 DA PATRICK GERDSMEIER ED E' RILASCIATO CON LICENZA GPL.   "
		"BUON DIVERTIMENTO!   DEDICATO A ULI     ",
		
		"DE TOETSEN 1, 2 EN 3 VOOR SPEL MODE KEUZE - "
		"TAB VERANDERD HET ZONNESTELSEL - "
		"CURSOR LINKS EN RECHTS GEBRUIKEN OM TE RICHTEN MET SCHIETEN - "
		"CURSOR OMHOOG EN OMLAAG OM HET RUIMTESCHIP TE BEWEGEN - "
		"HOUD SPATIEBALK INGEDRUKT OM SCHIETKRACHT TE VERHOGEN - "
		"EN LAAT SPATIEBALK LOS OM TE SCHIETEN - "
		"DRUK ENTER OM EEN KRACHTSCHILD OF NIEUWE WAPENS TE KOPEN - "
		"F WISSELD VAN WINDOW NAAR FULLSCREEN MODUS. "
		"C WISSELD COMPUTERKRACHT 1..5.   "
		"HIGHMOON DUEL IN DE RUIMTE IS GESCHREVEN DOOR PATRICK GERDSMEIER IN 2005"
		"DE LICENTIE IS GPL.   "
		"VEEL PLEZIER!   "
		"SPECIAAL GEMAAKT VOOR ULI     "	
	};

	return r[language];
}

std::string Language::getPlayertext( int id ) const 
{
	const std::string p[] = {
		"PLAYER",
		"SPIELER",
		"JOUEUR",
		"GRACZ",
		"JOGADOR",
		"JUGADOR",
		"U{POK",
		"GIOCATORE",
		"SPELER"
	};	

	std::ostringstream r;
	
	r << p[language] << " " << id;

	return r.str();
}

std::string Language::getComputertext( int strength ) const
{
	const std::string p[][5] = {
		{ "NOVICE", "RECRUIT", "SOLDIER", "OFFICER", "GENERAL" },
		{ "NEULING", "REKRUT", "SOLDAT", "OFFIZIER", "GENERAL" },
		{ "DiBUTANT", "REKRUT", "SOLDAT", "AGENT", "GiNiRALE" },
		{ "NOWICJUSZ", "REKRUT", "fOcNIERZ", "OFICER", "GENERAc" },
		{ "INICIANTE", "REKRUTANTE", "SOLDADO", "OFICIAL", "GENERAL" },
		{ "NOVICIO", "RECLUTA", "SOLDADO", "OFICIAL", "GENERAL" },
		{ "HOBnsOK", "PEKPYT", "COlyAT", "OqnzEP", "{ENEPAl" },
		{ "DILETTANTE", "RECLUTA", "SOLDATO", "UFFICIALE", "GENERALE" },
		{ "BEGINNER", "RECRUIT", "SOLDAAT", "OFFICIER", "GENERAAL" }
	};

	std::ostringstream r;

	if (strength>4) 
		strength = 4;

	r << p[language][strength];
	
	return r.str();
}

std::string Language::getShieldtext( int energy ) const 
{
	const std::string p[] = {
		"SHIELD",
		"SCHILD",
		"BOUCLIER",
		"TARCZA",
		"ARMADURA",
		"PROTECION",
		"vnT",
		"SCUDO",
		"SCHILD"
	};

	std::ostringstream r;
	
	r << p[language] << " " << energy;

	return r.str();
}

std::string Language::getWinnertext( int winner ) const 
{
	const std::string p[][3] = {
		{
			"THE COMPUTER WON!",
			"PLAYER", "WON!"
		},
		{
			"DER COMPUTER HAT GEWONNEN!",
			"SPIELER", "HAT GEWONNEN!"
		},
		{
			"L'ORDNINATEUR A GAGNi!",
			"LE JOUEUR",
			"A GAGNi!"
		},
		{
			"KOMPUTER WYGRAc!",
			"GRACZ", "WYGRAc!"
		},
		{
			"O COMPUTADOR GANHOU!",
			"O JOGADOR", "GANHOU!"
		},
		{
			"EL ORDENADOR HA GANADO!"
			"JUGADOR", "HA GANADO!"
		},
		{
			"KOMpoTEP BwInTRAl!"
			"nTPOK", "BwInTRAl!"
		},

		{
			"IL COMPUTER HA VINTO!",
			"GIOCATORE", "HAI VINTO!"
		},
		
		{
			"DE COMPUTER HEEFT GEWONNEN!",
			"SPELER", "HEEFT GEWONNEN!"	
		}
	};

	std::ostringstream r;
	
	if (winner == -1)
		r << p[language][0];
	else
		r << p[language][1] << " " << winner << " "  << p[language][2];

	return r.str();
}

std::string Language::getWarptext( int seed, int planets ) const
{
	const std::string p[] = {
		"NUMBER",
		"NUMMER",
		"NUMiRO",
		"GALAKTYKI",
		"NUMERO",
		"NUMERO",
		"{AlAKTnKY",
		"NUMERO",
		"NUMMER"
	};

	std::ostringstream r;

	r << p[language] << " " << seed << "." << planets;

	return r.str();
}

std::string Language::getWarptext() const
{
	const std::string r[] = {
		"WARPING TO GALAXY",
		"WARPE ZUR GALAXIE",
		"WARPE h LA GALAXIE",
		"TELEPORTACJA DO",
		"WARPE PELA GALhXIA",
		"SALTAR A LA GALAXIA",
		"TElEpORTAznr B",
		"VERSO LA GALASSIA",
		"ZONNESTELSEL"		
	};

	return r[language];
}


