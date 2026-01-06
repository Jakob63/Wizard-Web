# Wizard-Web

Ein Play Framework basiertes Web-Frontend für das Wizard-Kartenspiel mit getrennter Domäne/Logik (Modul `wizard`) und Web-Schicht (Modul `wizardweb`).

## Projektstruktur

- `wizard/`: Kern-Domäne, Logik und Views (TUI)
    - `components/`: `Configuration`, `DefaultConfig`
    - `controller/`: `GameLogic`, `RoundLogic`, `PlayerLogic` und Basisimplementierungen
    - `model/`: Karten, Runden, Spieler, etc.
    - `aView/`: `TextUI` (TUI-Anzeige)
    - `util/`: `UserInput`-API (Abstraktion) und `QueueInput` (Implementierung)
    - `Wizard.scala`: Einstiegspunkt und Verkabelung
- `wizardweb/`: Play Web-App
    - `app/controllers/`: z. B. `HomeController`, `WebTui`
    - `app/views/`: Twirl-Templates (`index.scala.html`, `ingame.scala.html`, ...)
    - `app/components/`: `WebConfiguration`

## Laufzeit–Verdrahtung

- Das Spiel wird über `Wizard.entry(config, input)` gestartet.
- Web: `HomeController` injiziert `UserInput` (DI) und startet in einem Thread:
  ```scala
  new Thread(() => Wizard.entry(WebConfiguration(), input)).start()