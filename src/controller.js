import createLogger from "logging";

import { speichereNachricht,
         holeNachrichten,
         holeDistinctNutzer } from "./persistenz.js";

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


    const collectionBenutzer = BASIS_URL + "/benutzer";

    expressObjekt.get( collectionBenutzer, getBenutzer );
    logger.info( "Route registriert: GET ", collectionBenutzer );
}


/**
 * Event-Handler für POST-Anfrage zum Anlegen einer neuen Nachricht.
 *
 * @param {*} request Muss die beiden Pflichtattribute "benutzername" und "nachricht" im Body enthalten.
 *
 * @param {*} response Response-Codes: 201 = Created, 400 = Bad Request (unvollständige Attribute),
 *                     500 = Internal Server Error (Fehler beim Speichern der Nachricht auf Datenbank).
 *                     JSON enthält immer das Attribut "status" mit Wert "OK" oder "Fehler", im Fehlerfall
 *                     zusätzlich das Attribut "fehlertext" mit einer Fehlerbeschreibung.
 */
async function postNachricht( request, response ) {

    const benutzername = request.body.benutzername;
    const nachricht    = request.body.nachricht;

    if ( !benutzername || !nachricht ) {

        logger.warn( "Ungültige Anfrage, fehlende oder leere Felder." );
        response.status( 400 )
                .json( { status    : "Fehler",
                         fehlertext: "Ungültige Anfrage, fehlende oder leere Felder." } );
    } else {

        const erfolgreichGespeichert =
                    await speichereNachricht( benutzername.trim(), nachricht.trim() );

        if ( erfolgreichGespeichert ) {

            response.status( 201 )
                    .json( { status: "OK" } );
        } else {

            response.status( 500 )
                    .json( { status    : "Fehler",
                             fehlertext: "Fehler beim Speichern der Nachricht." } );
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
 *                     zusätzlich das Attribut "fehlertext" mit einer Fehlerbeschreibung. Im Erfolgsfall enthält
 *                     JSON zusätzlich das Attribut "nachrichten" mit einem Array aller Nachrichten des Nutzers,
 *                     sowie das Attribut "anzahl" mit der Anzahl der Nachrichten.
 */
async function getNachrichten( request, response ) {

    const benutzername = request.query.benutzername;

    if ( !benutzername ) {

        logger.warn( "Ungültige Anfrage, fehlender Parameter 'benutzername'." );
        response.status( 400 )
                .json( { status : "Fehler",
                         message: "Ungültige Anfrage, fehlender Parameter 'benutzername'." } );
    } else {

        const nachrichtenArray = await holeNachrichten( benutzername.trim() );

        if ( nachrichtenArray === null ) {

            response.status( 500 )
                    .json( { status    : "Fehler",
                             fehlertext: "Fehler beim Abrufen der Nachrichten von der Datenbank." } );
        } else

            response.status( 200 )
                    .json( { status     : "OK",
                             anzahl     : nachrichtenArray.length,
                             nachrichten: nachrichtenArray
                           } );
    }
}


/**
 * Event-Handler für GET-Anfrage zur Abfrage aller Nutzer, die mindestens eine Nachricht
 * gepostet haben.
 *
 * @param {*} request Wird nicht ausgewertet
 *
 * @param {*} response Array mit allen Nutzern im Attribut "nutzer", sowie die Anzahl
 *                     der Nutzer im Attribut "anzahl"; im Fehlerfall wird ein
 *                     Fehlertext im Attribut "fehlertext" zurückgegeben.
 */
async function getBenutzer( request, response ) {

    const nutzerArray = await holeDistinctNutzer();
    if ( nutzerArray === null ) {

        response.status( 500 )
                .json( { status    : "Fehler",
                         fehlertext: "Fehler beim Abrufen der Nutzer von der Datenbank." } );
    } else {

        response.status( 200 )
                .json( { status: "OK",
                         anzahl: nutzerArray.length,
                         nutzer: nutzerArray
                       } );
    }
}
