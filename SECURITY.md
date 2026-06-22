# Sicherheit

## Umgang mit API-Keys

OpenLearn speichert KI-API-Keys **ausschließlich im Betriebssystem-Schlüsselspeicher**
(Windows Credential Manager, via `keyring`-Crate). Konkret:

- Keys werden **nie** im Klartext, **nie** in der SQLite-Datenbank und **nie** in einer Datei
  abgelegt.
- Der Key wird nach dem Schreiben in den Keychain im Speicher **zeroized** (`zeroize`).
- Das Frontend bekommt einen Key **nie** zurück — nur ein `bool` „vorhanden / nicht vorhanden".
- Logs **redacten** `Authorization`, `x-api-key` und `?key=` automatisch.
- KI-Aufrufe gehen nur an den **vom Nutzer konfigurierten** Endpoint (BYOK). Kein eigenes Backend.

## Keine Telemetrie

OpenLearn sendet keinerlei Nutzungs- oder Diagnosedaten. Alle Lern-/Fortschrittsdaten bleiben
lokal in `openlearn.db` im App-Daten-Verzeichnis.

## Eine Schwachstelle melden

Bitte **kein** öffentliches Issue für sicherheitsrelevante Funde. Stattdessen über
GitHub „Security advisories" (Private Vulnerability Reporting) oder per E-Mail an den
Maintainer. Wir reagieren so schnell wie möglich.

## Unsignierte Builds

Release-`.exe`-Dateien sind aktuell nicht code-signiert. Lade Builds nur aus den offiziellen
[GitHub Releases](../../releases). SmartScreen-Warnung beim ersten Start ist erwartbar.
