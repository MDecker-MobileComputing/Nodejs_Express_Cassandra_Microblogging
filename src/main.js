import createLogger from "logging";
import express      from "express";

import { initDatenbankverbindung } from './persistenz.js';


const logger = createLogger( "main" );

try {

    await initDatenbankverbindung();

    logger.info( "Verbindung zu Datenbank aufgebaut." );

} catch ( fehler ) {

    logger.error( "Verbindung zu Datenbank konnte nicht aufgebaut werden.", fehler );
    process.exit(1);
}

const expressObjekt = express();

expressObjekt.use( express.static( "public_html" ) );

const PORTNUMMER = 8080;

expressObjekt.listen( PORTNUMMER,
            () => { logger.info(`Web-Server auf Port ${PORTNUMMER} gestartet.\n`); }
          );
