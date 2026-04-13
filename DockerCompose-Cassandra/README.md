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

Log-Dateien von den drei Containern auslesen:
```
docker logs -f kinoprogramm-cassandra-1
docker logs -f kinoprogramm-cassandra-2
docker logs -f cassandra-web
```

<br>

## Cassandra Web ##

<br>

Web-UI für Cassandra, siehe auch: https://github.com/avalanche123/cassandra-web

Verbindet sich beim Start automatisch mit der Cassandra-Instanz, ist danach
lokal unter http://localhost:3000 erreichbar.

<br>

Beispiel für Befehl mit der *Cassandra Query Language (CQL)*, die man mit diesem Web-UI direkt ausführen kann:
```
select * from kino.kinoprogramm
```

<br>