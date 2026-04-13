import createLogger from "logging";
import cassandra from "cassandra-driver";

const logger = createLogger( "persistenz" );


/** Keyspace mit allen Tabellen der Anwendung. */
const MEIN_KEYSPACE = "microblogging";



let cassandraClient = null;


/**
 * Verbindung zu Cassandra-DB aufbauen.
 *
 * @returns Casssandra-Objekt
 */
export async function initDatenbankverbindung() {

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
        logger.info( "Verbindung zu Cassandra-Datenbank aufgebaut" );

        await checkKeyspace();

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
    const anzahlKeyspaces = keyspacesArray.length;
    const keyspacesString = keyspacesArray.join( ", " );
    logger.info(
        `Verfügbare Keyspaces (${anzahlKeyspaces}): ${keyspacesString}` );

    if ( keyspacesArray.includes( MEIN_KEYSPACE ) ) {

        logger.info( `Keyspace "${MEIN_KEYSPACE}" schon vorhanden.` );

    } else {

        logger.warn( `Keyspace "${MEIN_KEYSPACE}" noch nicht vorhanden, versuche ihn zu erzeugen.` );

        await cassandraClient.execute(
            `CREATE KEYSPACE ${MEIN_KEYSPACE} WITH REPLICATION = { 'class': 'SimpleStrategy', 'replication_factor': 1 }`
        );

        logger.info( `Keyspace "${MEIN_KEYSPACE}" erfolgreich erzeugt.` );
    }
}
