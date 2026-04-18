"use strict";


let textareaNachricht   = null;
let nutzername          = null;
let alleNachrichtenLink = null;


/*
 * Diese Funktion wird aufgerufen, wenn das HTML-Dokument vollständig geladen wurde.
 */
window.addEventListener( "load", function() {

    const urlParams = new URLSearchParams( window.location.search );
    nutzername = urlParams.get( "nutzer" );
    if ( !nutzername ) {

        alert( "Fehler: Kein Nutzer angemeldet (URL-Parameter \"nutzer\" fehlt)." );
        document.getElementById( "formFieldset" ).disabled = true;
        return;
    }

    const seiteTitel = document.getElementById( "seite-titel" );
    seiteTitel.textContent += ` als Nutzer "${nutzername}"`;

    textareaNachricht = document.getElementById( "nachricht" );

    alleNachrichtenLink = document.getElementById( "alle-nachrichten-link" );

    const form = document.getElementById( "postForm" );
    form.addEventListener( "submit", function (event) {

        event.preventDefault(); // verhindert das Neuladen der Seite
        onSendenButton();
    });    
} );


/**
 * Event-Handler für den "Senden"-Button. 
 */
async function onSendenButton() {

    const text = textareaNachricht.value.trim();

    if ( !text ) {

        console.log("Nachricht ist leer, wird nicht gesendet.");
        return;
    }


    try {
        const response = await fetch( "/api/v1/nachrichten", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                benutzername: nutzername,
                nachricht   : text
            }),
        });

        if ( !response.ok ) {

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        textareaNachricht.value = "";

        alert( "Nachricht erfolgreich gesendet!" );

        if ( alleNachrichtenLink || alleNachrichtenLink.href === "" ) {
            
            alleNachrichtenLink.href        = `anzeigen.html?nutzer=${encodeURIComponent( nutzername )}`;
            alleNachrichtenLink.textContent = `Alle Nachrichten von "${nutzername}" anzeigen`;
        }

    } catch (fehler) {

        alert( "Fehler beim Senden der Nachricht: " + fehler.message );
    }    
}