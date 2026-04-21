import createLogger from "logging";
import cassandra    from "cassandra-driver";

const logger = createLogger( "persistenz" );


/** Keyspace mit allen Tabellen der Anwendung. */
const MEIN_KEYSPACE = "microblogging";


/** Objekt für Arbeit mit Cassandra-API. */
let cassandraClient = null;


/*
 * Konsistenz-Level:

 * ONE          - Schnellstes, aber schwächste Garantie (nur 1 Replik)
 * TWO
 * THREE
 * LOCAL_ONE    - Standard für Single-Datacenter (nur lokale Replik)
 *
 * QUORUM       - Mehrheit der Repliken (besseres Gleichgewicht)
 * LOCAL_QUORUM - Quorum im lokalen Datencenter
 *
 * ALL          - Stärkste Garantie (alle Repliken bestätigen)
 *
 * ANY          - nur für Schreiboperationen:
 *                Coordinator kann den Write mit Hint-Mechanismus akzeptieren,
 *                selbst wenn keine Ziel-Replikat-Nodes direkt antworten.
 *
 * QUORUM und ALL sind starke Konsistenz-Level, alle anderen schwache.
 */

const KONSISTENZLEVEL_WRITE = cassandra.types.consistencies.quorum;

const KONSISTENZLEVEL_READ  = cassandra.types.consistencies.one;


/**
 * Verbindung zu Cassandra-DB aufbauen und bei Bedarf Keyspace und Tabelle anlegen.
 * Es wird auch eine Testnachricht gespeichert.
 *
 * @returns Casssandra-Objekt
 */
export async function initDatenbankverbindung() {

    logger.info( "Versuche, Verbindung zu Cassandra-Cluster aufzubauen ..." );

    cassandraClient = new cassandra.Client({
        contactPoints: [ "localhost:9042", "localhost:9043" ],
        localDataCenter: "rechenzentrum1" ,
        credentials: {
            username: "cassandra",
            password: "cassandra"
        }
    });

    try {

        await cassandraClient.connect();
        logger.info( "Verbindung zu Cassandra-Cluster aufgebaut." );

        await erzeugeKeyspace();
        await erzeugeTabelle();

        await speichereNachricht( "testnutzer",
                                  `DB-Test am ${new Date().toLocaleString("de-DE")} Uhr` );
        return cassandraClient;

    } catch ( fehler ) {

        logger.error( "Initialisierung von Verbindung zu Cassandra-DB fehlgeschlagen: ",
                      fehler );
        throw fehler;
    }
}


/**
 * Keyspace für Applikation bei Bedarf anlegen.
 *
 * Für Schema-Operationen werden Konsistenzlevel nicht berücksichtigt, da diese
 * über das Gossiping-Protokoll zwischen den Knoten synchronisiert werden.
 */
async function erzeugeKeyspace() {

    await cassandraClient.execute(
        `CREATE KEYSPACE IF NOT EXISTS ${MEIN_KEYSPACE}
                WITH REPLICATION = { 'class'             : 'SimpleStrategy',
                                     'replication_factor': 1                 }`
    );

    logger.info( `Keyspace "${MEIN_KEYSPACE}" angelegt oder existierte bereits.` );
}


/**
 * Tabelle für Applikation bei Bedarf anlegen.
 *
 * Für Schema-Operationen werden Konsistenzlevel nicht berücksichtigt, da diese
 * über das Gossiping-Protokoll zwischen den Knoten synchronisiert werden.
 */
async function erzeugeTabelle() {

    await cassandraClient.execute(
        `CREATE TABLE IF NOT EXISTS ${MEIN_KEYSPACE}.nachrichten (
            nachricht_id   UUID,
            benutzername   TEXT,
            nachricht_text TEXT,
            erstellt_am    TIMESTAMP,
            PRIMARY KEY ( (benutzername), erstellt_am )
        ) WITH CLUSTERING ORDER BY ( erstellt_am DESC )`
    );
    // Partition  Key: benutzername
    // Clustering Key: erstellt_am

    // Anzahl Records in Tabelle nachrichten zählen
    const countResult = await cassandraClient.execute(
        `SELECT COUNT(*) AS anzahl FROM ${MEIN_KEYSPACE}.nachrichten`
    );
    const anzahlNachrichten = countResult.rows[0].anzahl;
    logger.info( `Anzahl Einträge in Tabelle "nachrichten": ${anzahlNachrichten}` );
}


/**
 * Nachricht in Datenbank schreiben.
 *
 * @param {String} benutzername Nutzername von Verfasser der Nachricht
 *
 * @param {String} nachricht Eigentlich Inhalt der (Kurz-)Nachricht
 *
 * @return {Boolean} `true` wenn Nachricht erfolgreich gespeichert wurde
 */
export async function speichereNachricht( benutzername, nachricht ) {

    const nachricht_id = cassandra.types.uuid();
    const erstellt_am  = new Date();

    try {

        await cassandraClient.execute(
            `INSERT INTO ${MEIN_KEYSPACE}.nachrichten
                ( nachricht_id, benutzername, nachricht_text, erstellt_am )
                VALUES ( ?, ?, ?, ? )`,
            [ nachricht_id, benutzername, nachricht, erstellt_am ],
            {
                prepare: true, // Prepared Statement
                consistencyLevel: KONSISTENZLEVEL_WRITE
            }
        );


        logger.info( `Nachricht von "${benutzername}" erfolgreich gespeichert: "${nachricht}"` );
        return true;

    } catch ( fehler ) {

        logger.error( `Fehler beim Speichern der Nachricht: `, fehler );
        return false;
    }
}


/**
 * Alle Nachrichten eines bestimmten Nutzers aus der Datenbank lesen.
 *
 * @param {*} benutzername Name des Nutzers, dessen Nachrichten von der Datenbank
 *                         gelesen werden sollen
 *
 * @returns {Array} Array mit allen Nachrichten des Nutzers; Array kann leer sein,
 *                  wenn Nutzer keine Nachrichten hat; im Fehlerfall wird `null`
 *                  zurückgegeben.
 */
export async function holeNachrichten( benutzername ) {

    try {

        const queryErgebnis = await cassandraClient.execute(
            `SELECT nachricht_text, erstellt_am
                    FROM ${MEIN_KEYSPACE}.nachrichten
                    WHERE benutzername = ?`,
            [ benutzername ],
            {
                prepare: true, // Prepared Statement
                consistencyLevel: KONSISTENZLEVEL_READ
            }
        );

        const nachrichtenArray =
                    queryErgebnis.rows.map( row => ({
                        nachricht  : row.nachricht_text,
                        erstellt_am: row.erstellt_am
                    }) );

        return nachrichtenArray;

    } catch ( fehler ) {

        logger.error(
            `Fehler beim Abrufen der Nachrichten für Nutzer "${benutzername}": `,
            fehler );

        return null;
    }
}


/**
 * Alle Nutzer zurückliefern, die mindestens eine Nachricht in der Datenbank haben.
 *
 * @returns {Array} Array mit allen Nutzernamen, die mindestens eine Nachricht
 *                  in der Datenbank haben. Array kann leer sein, wenn keine
 *                  Nachrichten in der Datenbank sind; im Fehlerfall wird `null`
 *                  zurückgegeben.
 */
export async function holeDistinctNutzer() {

    try {

        const queryErgebnis = await cassandraClient.execute(
            `SELECT DISTINCT benutzername
                    FROM ${MEIN_KEYSPACE}.nachrichten`, // "ORDER BY benutzername" geht nicht mit DISTINCT
            {
                prepare: true, // Prepared Statement
                consistencyLevel: KONSISTENZLEVEL_READ
            }
        );

        const distinctNutzerArray = queryErgebnis.rows.map( row => row.benutzername ).sort();

        return distinctNutzerArray;

    } catch ( fehler ) {

        logger.error(
            `Fehler beim Abrufen der distinct Benutzernamen: `,
            fehler );

        return null;
    }
}
