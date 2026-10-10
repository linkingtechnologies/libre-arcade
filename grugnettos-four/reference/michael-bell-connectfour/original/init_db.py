#!/usr/bin/env python

"""
init_db.py

Run this function to create or re-initialize an existing sqlite database for
storing information about win probabilities for board configurations.
"""

"""
Copyright 2012 Michael Bell

This file is part of connectfour.

connectfour is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

connectfour is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with connectfour.  If not, see <http://www.gnu.org/licenses/>.
"""

import sqlite3 as sql

db_name = "games.db"
table_name = "Knowledge"


def init_db():
    """
    Initializes the games.db database. If a database does not exist, it will be
    created.
    """

    print "Initializing the " + db_name + " databse."

    con = sql.connect(db_name)

    with con:
        cur = con.cursor()
        cur.execute("DROP TABLE IF EXISTS " + table_name)
        cur.execute("CREATE TABLE " + table_name +
                    "(id INTEGER PRIMARY KEY, " +
                    "board_id TEXT, mirror_id TEXT, ngames INT, " +
                    "np1wins INT, prob1 FLOAT, prob2 FLOAT)")
        cur.execute("CREATE UNIQUE INDEX board_id_index ON " +
                    table_name + "(board_id)")
        cur.execute("CREATE UNIQUE INDEX mirror_id_index ON " +
                    table_name + "(mirror_id)")
        cur.execute("CREATE UNIQUE INDEX entry_id_index ON " +
                    table_name + "(id)")

if __name__ == "__main__":
    init_db()
