import createLogger from "logging";

import { speichereNachricht, holeNachrichten } from "./persistenz.js";

const logger = createLogger( "express" );

const BASIS_URL = "/api/v1";


/**
 * Routen registrieren.
 *
 * @param app App-Objekt von Express.js
 */
export function routenRegistrieren( expressObjekt ) {

    const collectionNachrichten = BASIS_URL + "/nachrichten";

    expressObjekt.get( collectionNachrichten, getNachrichten );
    logger.info( "Route registriert: GET ", collectionNachrichten );

    expressObjekt.post( collectionNachrichten, postNachricht );
    logger.info( "Route registriert: POST ", collectionNachrichten );
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


/**
 * Event-Handler für GET-Anfrage zur Abfrage aller Nachrichten eines bestimmten Nutzers.
 *
 * @param {*} request Muss das Pflichtattribut "benutzername" als Query-Parameter enthalten.
 *
 * @param {*} response Response-Codes: 200 = OK, 400 = Bad Request (fehlender Parameter "benutzername"),
 *                     500 = Internal Server Error (Fehler beim Abrufen der Nachrichten von der Datenbank).
 *                     JSON enthält immer das Attribut "status" mit Wert "OK" oder "Fehler", im Fehlerfall
 *                     zusätzlich das Attribut "message" mit einer Fehlerbeschreibung. Im Erfolgsfall enthält
 *                     JSON zusätzlich das Attribut "nachrichten" mit einem Array aller Nachrichten des Nutzers,
 *            das auch leer sein kann.
 */
async function getNachrichten( request, response ) {

    const benutzername = request.query.benutzername;

    if ( !benutzername ) {

        logger.warn( "Ungültige Anfrage, fehlender Parameter 'benutzername'." );
        response.status( 400 )
                .json( { status: "Fehler",
                         message: "Ungültige Anfrage, fehlender Parameter 'benutzername'." } );
    } else {

        const nachrichtenArray = await holeNachrichten( benutzername.trim() );
        response.status( 200 )
                .json( { status: "OK", nachrichten: nachrichtenArray } );
    }
}
