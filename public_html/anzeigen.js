"use strict";


/*
 * Diese Funktion wird aufgerufen, wenn das HTML-Dokument vollständig geladen wurde.
 */
window.addEventListener( "load", function() {

    const ergebnisDiv = document.getElementById( "nachrichten" );
    const seiteTitel  = document.getElementById( "seite-titel" );

    // URL-Parameter Nutzer auslesen
    const urlParams = new URLSearchParams( window.location.search );
    const nutzer = urlParams.get( "nutzer" );

    if ( !nutzer ) {

        ergebnisDiv.textContent = "Fehler: URL-Parameter \"nutzer\" fehlt.";
        return;
    }

    seiteTitel.textContent = `Alle Nachrichten von "${nutzer}"`;

    const url = "/api/v1/nachrichten?benutzername=" + encodeURIComponent( nutzer );

    fetch( url )
        .then( function( response ) {

            if ( !response.ok ) {

                ergebnisDiv.textContent = "Fehler: " + response.status + " " + response.statusText;
                return;
            }

            return response.json();
        } )
        .then( function( daten ) {

            const nachrichtenArray = daten.nachrichten;

            if ( !nachrichtenArray || nachrichtenArray.length === 0 ) {

                ergebnisDiv.textContent = `Keine Nachrichten für Benutzer "${nutzer}" gefunden.`;
                return;
            }

            
            nachrichtenArray.forEach( function( nachricht ) {

                const paragraph = document.createElement( "p" );
                const datumZeitString = new Date( nachricht.erstellt_am ).toLocaleString();
                paragraph.textContent += nachricht.nachricht + " (" + datumZeitString + ")\n";
                ergebnisDiv.appendChild( paragraph );
            } );
            
            seiteTitel.textContent += ` (${nachrichtenArray.length})`;

        } )
        .catch( function( error ) {     
            ergebnisDiv.textContent = "Fehler beim Abrufen der Nachrichten.";
            console.error( "Fehler:", error );
        });
} );