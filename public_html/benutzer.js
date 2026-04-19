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

                // Create table row
                const row = document.createElement("tr");

                // Username cell
                const nameCell = document.createElement("td");
                nameCell.textContent = benutzername;

                // Nachrichten link cell
                const nachrichtenCell = document.createElement("td");
                const nachrichtenLink = document.createElement("a");
                nachrichtenLink.textContent = "[Nachrichten]";
                nachrichtenLink.href = `anzeigen.html?nutzer=${encodeURIComponent(benutzername)}`;
                nachrichtenCell.appendChild(nachrichtenLink);

                // Posten link cell
                const postenCell = document.createElement("td");
                const postenLink = document.createElement("a");
                postenLink.textContent = "[Nachricht posten]";
                postenLink.href = `posten.html?nutzer=${encodeURIComponent(benutzername)}`;
                postenCell.appendChild(postenLink);

                // Append cells to row
                row.appendChild(nameCell);
                row.appendChild(nachrichtenCell);
                row.appendChild(postenCell);

                // Append row to table (ergebnisDiv should be a <table> or <tbody>)
                tabelle.appendChild(row);
            }
        } );

} );