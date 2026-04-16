import createLogger from "logging";
import cassandra    from "cassandra-driver";

const logger = createLogger( "persistenz" );


/** Keyspace mit allen Tabellen der Anwendung. */
const MEIN_KEYSPACE = "microblogging";


/** Objekt für Arbeit mit Cassandra-API. */
let cassandraClient = null;


/**
 * Verbindung zu Cassandra-DB aufbauen.
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

        await checkKeyspace();
        await checkTabelle();

        await speichereNachricht( "testnutzer",
                                  `DB-Test am ${new Date().toLocaleString("de-DE")}` );

        return cassandraClient;

    } catch ( fehler ) {

        logger.error( "Verbindung zu Cassandra-Datenbank fehlgeschlagen: ", fehler );
        throw fehler;
    }
}


/**
 * Keyspace für Applikation bei Bedarf anlegen.
 */
async function checkKeyspace() {

    // Alle Keyspaces auslesen
    const queryResult = await cassandraClient.execute(
        "SELECT keyspace_name FROM system_schema.keyspaces"
    );

    const keyspacesArray  = queryResult.rows.map( row => row.keyspace_name );

    /*
    const anzahlKeyspaces = keyspacesArray.length;
    const keyspacesString = keyspacesArray.join( ", " );
    logger.info(
        `Verfügbare Keyspaces (${anzahlKeyspaces}): ${keyspacesString}` );
    */

    if ( keyspacesArray.includes( MEIN_KEYSPACE ) ) {

        logger.info( `Keyspace "${MEIN_KEYSPACE}" schon vorhanden.` );

    } else {

        logger.warn( `Keyspace "${MEIN_KEYSPACE}" noch nicht vorhanden, versuche ihn zu erzeugen.` );

        await cassandraClient.execute(
            `CREATE KEYSPACE ${MEIN_KEYSPACE}
                 WITH REPLICATION = { 'class': 'SimpleStrategy', 'replication_factor': 1 }`
        );

        logger.info( `Keyspace "${MEIN_KEYSPACE}" erfolgreich erzeugt.` );
    }
}


/**
 * Tabelle für Applikation bei Bedarf anlegen.
 *
 * Für Schema-Operationen werden Konsistenzlevel nicht berücksichtigt, da diese
 * über das Gossiping-Protokoll zwischen den Knoten synchronisiert werden.
 */
async function checkTabelle() {

    // Prüfe ob Tabelle "nachrichten" existiert
    const queryResult = await cassandraClient.execute(
        `SELECT table_name FROM system_schema.tables
           WHERE keyspace_name = '${MEIN_KEYSPACE}'
           AND table_name = 'nachrichten'`
    );

    if ( queryResult.rows.length > 0 ) {

        logger.info( `Tabelle "nachrichten" schon vorhanden.` );

    } else {

        logger.warn(
            `Tabelle "nachrichten" noch nicht vorhanden, versuche sie zu erzeugen.` );

        await cassandraClient.execute(
            `CREATE TABLE IF NOT EXISTS ${MEIN_KEYSPACE}.nachrichten (
                nachricht_id UUID,
                benutzername TEXT,
                nachricht_text TEXT,
                erstellt_am TIMESTAMP,
                PRIMARY KEY ((benutzername), erstellt_am)
            ) WITH CLUSTERING ORDER BY (erstellt_am DESC)`
        );
        // Partition  Key: benutzername
        // Clustering Key: erstellt_am

        logger.info( `Tabelle "nachrichten" erfolgreich erzeugt.` );
    }
}


/**
 * Nachricht in Datenbank schreiben.
 *
 * @param {String} benutzername Nutzername von Verfasser der Nachricht
 *
 * @param {String} nachricht Eigentlich Inhalt der (Kurz-)Nachricht
 *
 * @return {Boolean} `true` wenn Nachricht erfolgreich speichern konnte
 */
export async function speichereNachricht( benutzername, nachricht ) {

    const nachricht_id = cassandra.types.uuid();
    const erstellt_am  = new Date();

    try {

        await cassandraClient.execute(
            `INSERT INTO ${MEIN_KEYSPACE}.nachrichten
                (nachricht_id, benutzername, nachricht_text, erstellt_am)
                VALUES (?, ?, ?, ?)`,
            [ nachricht_id, benutzername, nachricht, erstellt_am ],
            {
                prepare: true, // Prepared Statement
                consistencyLevel: cassandra.types.consistencies.quorum
            }
        );

        // Konsistenzlevel-Optionen:
        // ONE          - Schnellste, aber schwächste Garantie (nur 1 Replik)
        // LOCAL_ONE    - Standard für Single-Datacenter (nur lokale Replik)
        // QUORUM       - Mehrheit der Repliken (besseres Gleichgewicht)
        // LOCAL_QUORUM - Quorum im lokalen Datencenter
        // ALL          - Stärkste Garantie (alle Repliken bestätigen)

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

        const queryResult = await cassandraClient.execute(
            `SELECT nachricht_text, erstellt_am FROM ${MEIN_KEYSPACE}.nachrichten
                WHERE benutzername = ?`,
            [ benutzername ],
            {
                prepare: true, // Prepared Statement
                consistencyLevel: cassandra.types.consistencies.localQuorum
            }
        );

        const nachrichtenArray =
                    queryResult.rows.map( row => ({
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