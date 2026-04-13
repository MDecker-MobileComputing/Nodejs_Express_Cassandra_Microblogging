import createLogger from "logging";
import cassandra from "cassandra-driver";

const logger = createLogger( "persistenz" );


let client = null;


export async function initDatenbankverbindung() {

    client = new cassandra.Client({
        contactPoints: [ "localhost:9042", "localhost:9043" ],
        localDataCenter: "rechenzentrum1" ,
        credentials: {
            username: "cassandra",
            password: "cassandra"
        }
    });

    try {
        await client.connect();
        logger.info( "Verbindung zu Cassandra-Datenbank aufgebaut" );
        return client;

    } catch ( fehler ) {

        logger.error( "Verbindung zu Cassandra-Datenbank fehlgeschlagen: ", fehler );
        throw fehler;
    }
}
