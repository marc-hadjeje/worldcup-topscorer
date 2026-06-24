import pyodbc, struct
tok = open("token.txt").read().strip().encode("utf-16-le")
ts = struct.pack("=i", len(tok)) + tok
conn = pyodbc.connect(
    "Driver={ODBC Driver 18 for SQL Server};"
    "Server=filsoiygbkaulmvzrvxodo4zyy-uvn7jcscom3evizssejax6p2tq.database.fabric.microsoft.com,1433;"
    "Database=worldcup-topscorer-06832c9e-ac5d-4b2f-a7a0-eb698a6913c8;"
    "Encrypt=yes;TrustServerCertificate=no",
    attrs_before={1256: ts})
cur = conn.cursor()
# Official list shows the Brazilian simply as "Ronaldo" -> firstName='', lastName='Ronaldo'
cur.execute("UPDATE dbo.Players SET firstName='', lastName='Ronaldo' WHERE firstName='Ronaldo' AND lastName='Nazário'")
print("renamed rows:", cur.rowcount)
conn.commit()
cur.execute("""SELECT firstName,lastName,number,allTimeGoals,goals,t.code
 FROM dbo.Players p LEFT JOIN dbo.Teams t ON p.team_id=t.id
 WHERE lastName='Ronaldo' ORDER BY allTimeGoals DESC""")
for r in cur.fetchall(): print(tuple(r))
