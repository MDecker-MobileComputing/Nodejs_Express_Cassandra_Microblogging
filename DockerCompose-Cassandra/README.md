# Docker-Container #

<br>

Dieses Verzeichnis enthält eine Datei [docker-compose.yml](docker-compose.yml)
für einen aus zwei Instanzen bestehenden Cassandra-Cluster:
* `cassandra-1` an Port 9042 (Default-Port)
* `cassandra-2` an Port 9043

<br>

----

## CQL-Befehle ##

<br>

Terminal zu einer der beiden Instanzen öffnen und mit dem CLI `cqlsh` (Cassandra Query Language Shell) starten. Die CLI-Sitzung wird mit dem Befehl `quit` beendet.

<br>

Alle Keyspaces ausgeben: `DESCRIBE KEYSPACES`

Details zu einzelnem Keyspace abfragen: `DESCRIBE KEYSPACE <name_keyspace>`

<br>

Keyspace anlegen:
```
CREATE KEYSPACE microblogging IF NOT EXISTING
       WITH REPLICATION = {
              'class'             : 'SimpleStrategy',
              'replication_factor': 1
       };
```

Ein Cassandra-Knoten kann über seine Konfiguration erfahren, in welchem Rechenzentrum
er läuft. Diese Information kann man ausnutzen, um beim Anlegen eines Keyspaces
festzulegen, wie viele Replikate in den einzelnen Rechenzentren laufen sollen:
```
CREATE KEYSPACE mein_keyspace
       WITH replication = {
              'class'         : 'NetworkTopologyStrategy',
              'rechenzentrum1': 2,
              'rechenzentrum2': 2
       };
```
Achtung: Es muss hierfür auch `NetworkTopologyStrategy` statt `SimpleStrategy` als Wert für `class` gewählt werden.

<br>

Anlegen einer Tabelle in dem so erstellten Keyspace:
```
CREATE TABLE IF NOT EXISTS microblogging.nachrichten (
       nachricht_id   UUID,
       benutzername   TEXT,
       nachricht_text TEXT,
       erstellt_am    TIMESTAMP,
       PRIMARY KEY ( (benutzername), erstellt_am )
) WITH CLUSTERING ORDER BY ( erstellt_am DESC )
```

<br>

Alle Nachrichten eines bestimmten Nutzers abfragen:
```
SELECT nachricht_text, erstellt_am
       FROM microblogging.nachrichten
       WHERE benutzername = 'testnutzer';
```

<br>

Abfragen, welche Nutzer es gibt:
```
SELECT DISTINCT benutzername
       FROM microblogging.nachrichten;
```
Achtung: Sortieren der Nutzer mit `ORDER BY benutzername ASC` ist nicht möglich.

<br>

Die letzten 20 Nachrichten über alle Nutzer abfragen:
```
SELECT * FROM microblogging.nachrichten
         ORDER BY erstellt_am
         DESC LIMIT 20;
```
Ergibt Fehlermeldung:
> InvalidRequest: Error from server: code=2200 [Invalid query] message="ORDER BY is only supported when the partition key is restricted by an EQ or an IN."

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
nodetool getendpoints microblogging nachrichten testnutzer
```
Funktioniert auch, wenn der *Partition Key* noch nicht existiert.

Es werden eine oder mehrere IP-Adressen ausgegeben.

<br>

Gossip-Info über alle Knoten abfragen:
```
nodetool gossipinfo
```

[Gossip](https://docs.datastax.com/en/cassandra-oss/3.x/cassandra/architecture/archGossipAbout.html)
ist das Peer-to-Peer-Protokoll von Cassandra, mit dem die Knoten direkt untereinander Zustandsinformationen
über Knoten austauschen.

<br>

Token von einzelnen Knoten für bestimmten Keyspace ausgeben lassen:
```
nodetool ring <keyspace>
nodetool ring microblogging
```

<br>

Token-Ranges ausgeben lassen (describe ring):
```
nodetool describering <keyspace>
nodetool describering microblogging
```
