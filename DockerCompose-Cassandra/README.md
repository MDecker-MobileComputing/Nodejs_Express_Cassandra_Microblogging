# Docker-Container #

<br>

Dieses Verzeichnis enthält eine Datei [docker-compose.yml](docker-compose.yml),
die folgende Container definiert:

* 2x Cassandra:
  * `cassandra-1` an Port 9042
  * `cassandra-2` an Port 9043
* Cassandra Web (Admin-UI) an Port 3000 (mit `cassandra-1` verbunden)

<br>

Die beiden Cassandra-Instanzen sind als Cluster verbunden, tauschen also untereinander
die Daten aus.

<br>

----

## CQL-Befehle ##

<br>

Terminal zu `microblogging-cassandra-1` öffnen und mit dem CLI `cqlsh` (Cassandra Query Language Shell) starten.

Alle Keyspaces ausgeben: `describe keyspaces`

Details zu einzelnem Keyspace abfragen: `DESCRIBE KEYSPACE <name_keyspace>`

<br>

Keyspace anlegen:
```
CREATE KEYSPACE microblogging
       WITH REPLICATION = { 'class': 'SimpleStrategy', 'replication_factor': 1 };
```

<br>

Alle Nachrichten eines bestimmten Nutzers abfragen:
```
SELECT nachricht_text, erstellt_am FROM microblogging.nachrichten WHERE benutzername = 'testnutzer';
```

<br>

Die letzten 20 Nachrichten über alle Nutzer abfragen:
```
SELECT * FROM microblogging.nachrichten ORDER BY erstellt_am DESC LIMIT 20;
```
Ergibt Fehlermeldung: 
> InvalidRequest: Error from server: code=2200 [Invalid query] message="ORDER BY is only supported when the partition key is restricted by an EQ or an IN."

<br>

Sitzung beenden (`cqlsh` verlassen): `quit`

<br>

----

## nodetool-Befehle ##

<br>

[Nodetool](https://cassandra.apache.org/doc/5.0/cassandra/managing/tools/nodetool/nodetool.html)
ist ein Kommandozeilen-Tool, das direkten Zugriff auf interne Verwaltungs- und Wartungsfunktionen
Cassandra-Clusters bietet.

<br>

Liste aller Knoten inkl. Datenvolumen ausgeben:
```
nodetool status
```

<br>

Abfrage, welche Knoten einen bestimmten Datensatz speichern müssen:
```
nodetool getendpoints <keyspace> <table> <partition_key>
```
Funktioniert auch, wenn der *Partition Key* noch nicht existiert.

<br>

Konkretes Beispiel:
```
nodetool getendpoints microblogging nachrichten testnutzer
```

Es werden eine oder mehrere IP-Adressen ausgegeben.

<br>

Gossip-Info über alle Knoten abfragen:
```
nodetool gossipinfo
```

[Gossip]](https://docs.datastax.com/en/cassandra-oss/3.x/cassandra/architecture/archGossipAbout.html)
ist das Peer-to-Peer-Protokoll von Cassandra, mit dem die Knoten direkt untereinander Zustandsinformationen
über Knoten austauschen.

<br>

----

## Cassandra Web ##

<br>

Web-UI für Cassandra, siehe auch: https://github.com/avalanche123/cassandra-web

Verbindet sich beim Start automatisch mit der Cassandra-Instanz, ist danach
lokal unter http://localhost:3000 erreichbar.

<br>