"use strict";


/*
 * Diese Funktion wird aufgerufen, wenn das HTML-Dokument vollständig geladen wurde.
 */
window.addEventListener( "load", function() {

    const seiteTitel = document.getElementById( "seite-titel" );
    const tabelle    = document.getElementById( "tabelle"     );

    // Alle Benutzer von der Server-API abrufen und anzeigen
    fetch( "api/v1/benutzer" )
        .then( function( response ) {

            if ( !response.ok ) {

                alert( "Fehler: " + response.status + " " + response.statusText );
                return;
            }

            return response.json();

        } ).then( function( daten ) {                

            const anzahlBenutzer = daten.nutzer.length;
            seiteTitel.textContent += ` (${anzahlBenutzer})`;

            for (let i = 0; i < daten.nutzer.length; i++) {

                const benutzername = daten.nutzer[i];

                const tabellenZeile = document.createElement( "tr" );

                // Username cell
                const zelleName       = document.createElement( "td" );
                zelleName.textContent = benutzername;

                // Nachrichten link cell
                const zelleNachrichten      = document.createElement( "td" );
                const nachrichtenLink       = document.createElement( "a" );
                nachrichtenLink.textContent = "[Nachrichten]";
                nachrichtenLink.href        = `anzeigen.html?nutzer=${encodeURIComponent( benutzername )}`;
                zelleNachrichten.appendChild( nachrichtenLink );

                // Posten link cell
                const zellePosten      = document.createElement( "td" );
                const postenLink       = document.createElement( "a" );
                postenLink.textContent = "[Nachricht posten]";
                postenLink.href        = `posten.html?nutzer=${encodeURIComponent( benutzername )}`;
                zellePosten.appendChild( postenLink );

                tabellenZeile.appendChild( zelleName        );
                tabellenZeile.appendChild( zelleNachrichten );
                tabellenZeile.appendChild( zellePosten      );

                tabelle.appendChild( tabellenZeile );
            }
        } );

} );