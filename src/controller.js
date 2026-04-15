import createLogger           from "logging";
import { speichereNachricht } from "./persistenz.js";

const logger = createLogger( "express" );

const BASIS_URL = "/api/v1";


/**
 * Routen registrieren.
 *
 * @param app App-Objekt von Express.js
 */
export function routenRegistrieren( expressObjekt ) {

    const postNachrichtUrl = BASIS_URL + "/nachrichten";
    expressObjekt.post( postNachrichtUrl, postNachricht );
    logger.info( "Route registriert: POST ", postNachrichtUrl );
}


/**
 * Event-Handler für POST-Anfrage zum Anlegen einer neuen Nachricht.
 *
 * @param {*} request Muss die beiden Pflichtattribute "benutzername" und "nachricht" im Body enthalten.
 *
 * @param {*} response Response-Codes: 201 = Created, 400 = Bad Request (unvollständige Attribute),
 *                     500 = Internal Server Error (Fehler beim Speichern der Nachricht auf Datenbank).
 *                     JSON enthält immer das Attribut "status" mit Wert "OK" oder "Fehler", im Fehlerfall
 *                     zusätzlich das Attribut "message" mit einer Fehlerbeschreibung.
 */
async function postNachricht( request, response ) {

    const benutzername = request.body.benutzername;
    const nachricht    = request.body.nachricht;

    if ( !benutzername || !nachricht ) {

        logger.warn( "Ungültige Anfrage, fehlende oder leere Felder." );
        response.status( 400 )
                .json( { status: "Fehler", message: "Ungültige Anfrage, fehlende oder leere Felder." } );

    } else {

        const erfolgreichGespeichert =
                    await speichereNachricht( benutzername.trim(), nachricht.trim() );
        if ( erfolgreichGespeichert ) {

            response.status( 201 )
                    .json( { status: "OK" } );

        } else {

            response.status( 500 )
                    .json( { status: "Fehler", message: "Fehler beim Speichern der Nachricht." } );
        }
    }
}