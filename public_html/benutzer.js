"use strict";


/*
 * Diese Funktion wird aufgerufen, wenn das HTML-Dokument vollständig geladen wurde.
 */
window.addEventListener( "load", function() {

    const seiteTitel  = document.getElementById( "seite-titel" );
    const ergebnisDiv = document.getElementById( "ergebnis"    );

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

            for ( let i = 0; i < daten.nutzer.length; i++ ) {

                const benutzername = daten.nutzer[i];
                const benutzerDiv = document.createElement( "div" );
                benutzerDiv.textContent = benutzername + "  ";

                // Link zum Anzeigen der Nachrichten des Benutzers
                const nachrichtenLink       = document.createElement( "a" );
                nachrichtenLink.textContent = "[Nachrichten]";
                nachrichtenLink.href        = `anzeigen.html?nutzer=${encodeURIComponent( benutzername )}`;

                const blankText = document.createElement( "span" );
                blankText.textContent = "    ";

                const postenLink       = document.createElement( "a" );
                postenLink.textContent = "[Nachricht posten]";
                postenLink.href        = `posten.html?nutzer=${encodeURIComponent( benutzername )}`;

                ergebnisDiv.appendChild( benutzerDiv     );                
                benutzerDiv.appendChild( nachrichtenLink );
                benutzerDiv.appendChild( blankText       );
                benutzerDiv.appendChild( postenLink      );

                ergebnisDiv.appendChild( document.createElement( "br" ) );
            }
        } );

} );