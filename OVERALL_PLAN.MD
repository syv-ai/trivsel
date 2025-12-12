# TrivselsTracker - Kravspecifikation og User Stories

## Projektresumé

**Projekt:** TrivselsTracker  
**Dato:** December 2025  
**Version:** 1.0  
**Partnere:** TAMU, Bridge Consulting, CBS  

TrivselsTracker er et digitalt værktøj til at styrke fastholdelse og trivsel blandt udsatte unge på TAMU. Systemet indsamler ugentlige trivselsbesvarelser fra elever og giver mentorer og FACT/IPS-teams et datadrevet grundlag for tidlig indsats.

---

## 1. Funktionelle Krav

### 1.1 Elevmodul

| ID | Krav | Prioritet | Fase |
|----|------|-----------|------|
| F-E01 | Systemet skal sende ugentlig SMS med personligt link til spørgeskema | Must Have | Pilot |
| F-E02 | Systemet skal understøtte 2-faktor autentificering via SMS-kode (OTP) | Must Have | Pilot |
| F-E03 | Eleven skal kunne besvare 15 spørgsmål fordelt på 5 kategorier | Must Have | Pilot |
| F-E04 | Spørgsmål skal besvares på en 1-5 skala | Must Have | Pilot |
| F-E05 | Systemet skal vise simpel kvittering efter besvarelse ("Tak for dit svar") | Must Have | Pilot |
| F-E06 | Systemet skal registrere non-respons som en hændelse | Must Have | Pilot |
| F-E07 | Systemet skal sende 1-2 påmindelser ved manglende besvarelse | Must Have | Pilot |
| F-E08 | Spørgsmålsformuleringer skal kunne differentieres efter elevens fase (indslusning, hovedforløb, udslusning) | Must Have | Pilot |
| F-E09 | Besvarelsesflow skal kunne gennemføres på under 1 minut | Must Have | Pilot |
| F-E10 | Eleven skal kunne se egen trivselsudvikling over tid | Should Have | Senere |
| F-E11 | Systemet skal understøtte chat mellem elev og fagpersoner | Could Have | Senere |
| F-E12 | Systemet skal understøtte peer-grupper for elever | Could Have | Senere |
| F-E13 | Systemet skal kunne give målrettet feedback til eleven | Could Have | Senere |

### 1.2 Mentor/Fagpersonmodul

| ID | Krav | Prioritet | Fase |
|----|------|-----------|------|
| F-M01 | Mentorer skal have adgang til web-dashboard med liste over egne elever | Must Have | Pilot |
| F-M02 | Dashboard skal vise farvekoder (grøn/gul/rød) for hver elev | Must Have | Pilot |
| F-M03 | Ved klik på elev skal seneste trivselsscore pr. kategori vises | Must Have | Pilot |
| F-M04 | Systemet skal vise enkel historik (4-6 seneste målinger) | Must Have | Pilot |
| F-M05 | Systemet skal fremhæve kritisk score i udvalgte kategorier | Must Have | Pilot |
| F-M06 | Systemet skal fremhæve markant fald i trivsel | Must Have | Pilot |
| F-M07 | Systemet skal fremhæve gentagen non-respons | Must Have | Pilot |
| F-M08 | Mentorer skal kunne logge indsatsstatus (kontaktet, samtale planlagt, indsats igangsat) | Must Have | Pilot |
| F-M09 | Mentorer skal modtage ugentlig notifikation (SMS/APP) | Must Have | Pilot |
| F-M10 | Mentorer skal modtage notifikation ved kritisk score | Must Have | Pilot |
| F-M11 | Systemet skal understøtte feedback-modul til elever | Should Have | Senere |
| F-M12 | Systemet skal understøtte detaljeret interventionslog med kommentarer | Should Have | Senere |
| F-M13 | Systemet skal understøtte chat med elever | Could Have | Senere |

### 1.3 FACT/ACT/IPS Team-modul

| ID | Krav | Prioritet | Fase |
|----|------|-----------|------|
| F-T01 | Teams skal have adgang til elevers resultater og udvikling | Must Have | Pilot |
| F-T02 | Teams skal modtage notifikation ved kritisk score (adgang via elev) | Must Have | Pilot |
| F-T03 | Teams skal have adgang til høj-risiko elevers oversigt | Must Have | Pilot |
| F-T04 | Teams skal kunne se gruppe-trivselsoversigt | Should Have | Senere |
| F-T05 | Teams skal modtage notifikation ved tidlige faresignaler | Should Have | Senere |
| F-T06 | Teams skal have adgang til kontaktlog | Should Have | Senere |
| F-T07 | Teams skal kunne facilitere peer-grupper | Could Have | Senere |

### 1.4 Administrator-modul

| ID | Krav | Prioritet | Fase |
|----|------|-----------|------|
| F-A01 | Administrator skal kunne oprette og redigere elevdata | Must Have | Pilot |
| F-A02 | Administrator skal kunne tilknytte elever til mentorer | Must Have | Pilot |
| F-A03 | Administrator skal kunne administrere grupper | Must Have | Pilot |
| F-A04 | Administrator skal kunne håndtere deltagersamtykke | Must Have | Pilot |
| F-A05 | Systemet skal understøtte automatisk elevoprettelse/vedligeholdelse | Could Have | Senere |

### 1.5 Analytiker/Data-modul

| ID | Krav | Prioritet | Fase |
|----|------|-----------|------|
| F-D01 | CBS skal have adgang til anonymiserede/pseudonymiserede data med interne ID'er | Must Have | Pilot |
| F-D02 | Systemet skal understøtte dataeksport til eksterne analyseværktøjer | Must Have | Pilot |
| F-D03 | Systemet skal koble trivsel og indsatser for effektmåling | Should Have | Pilot |

### 1.6 Survey og Scoring

| ID | Krav | Prioritet | Fase |
|----|------|-----------|------|
| F-S01 | Systemet skal indsamle 15 besvarelser pr. uge fordelt på 5 kategorier: Trivsel, Motivation, Fællesskab, Selvindsigt, Arbejdsparathed | Must Have | Pilot |
| F-S02 | Systemet skal beregne rå scores (gennemsnit/sum) for hver kategori | Must Have | Pilot |
| F-S03 | Systemet skal beregne samlet trivselsscore (1-5) baseret på fagligt udviklet scoringsmodel | Must Have | Pilot |
| F-S04 | Systemet skal anvende tærskler til at farvekode scores som grøn/gul/rød | Must Have | Pilot |
| F-S05 | Scoringsmodel og tærskler skal kunne konfigureres (ikke nødvendigvis via UI i pilot) | Must Have | Pilot |

### 1.7 Regler og Varsling

| ID | Krav | Prioritet | Fase |
|----|------|-----------|------|
| F-R01 | Systemet skal udløse notifikation ved lav score | Must Have | Pilot |
| F-R02 | Systemet skal udløse notifikation ved fald over tid | Must Have | Pilot |
| F-R03 | Systemet skal udløse notifikation ved non-respons | Must Have | Pilot |
| F-R04 | Notifikationer skal kunne sendes via SMS og/eller APP | Must Have | Pilot |
| F-R05 | "Non-respons er også et svar" - skal automatisk udløse opmærksomhed | Must Have | Pilot |

---

## 2. Ikke-funktionelle Krav

### 2.1 Sikkerhed og GDPR

| ID | Krav | Prioritet | Fase |
|----|------|-----------|------|
| NF-S01 | Løsningen skal bygges efter Privacy by Design principper | Must Have | Pilot |
| NF-S02 | Elev-login skal ske via personlige links + SMS-kode (OTP) | Must Have | Pilot |
| NF-S03 | Faglige brugere skal logge ind via brugernavn + SMS-kode | Must Have | Pilot |
| NF-S04 | Løsningens arkitektur skal være forberedt på IdP-integration | Should Have | Pilot |
| NF-S05 | Al trafik skal ske over HTTPS (TLS) | Must Have | Pilot |
| NF-S06 | Data-at-rest skal være krypteret eller ligestillende løsning | Must Have | Pilot |
| NF-S07 | Mentorer må kun se egne elever | Must Have | Pilot |
| NF-S08 | FACT/teams må kun se relevante elever i deres team | Must Have | Pilot |
| NF-S09 | Adgangsmodellen skal kunne styres pr. organisation/skole | Should Have | Pilot |
| NF-S10 | Logning af loginforsøg, rolleændringer og adgang til elevdata | Must Have | Pilot |
| NF-S11 | Elever skal give informeret samtykke ved første login | Must Have | Pilot |
| NF-S12 | Data skal kunne slettes efter projektets afslutning eller ved tilbagetrukket samtykke | Must Have | Pilot |
| NF-S13 | Arkitekturen skal forberedes til automatisk tidsbaseret sletning/anonymisering | Should Have | Pilot |
| NF-S14 | Ingen GPS eller biometriske data må indsamles | Must Have | Pilot |

### 2.2 Tilgængelighed og Performance

| ID | Krav | Prioritet | Fase |
|----|------|-----------|------|
| NF-P01 | Systemet skal være tilgængeligt i perioder hvor elever forventes at svare (fx fredag-mandag) | Must Have | Pilot |
| NF-P02 | Løsningen skal kunne køre stabilt for 20-50 elever uden nedbrud | Must Have | Pilot |
| NF-P03 | Planlagt nedetid uden for survey-vinduer er acceptabel hvis varslet | Must Have | Pilot |
| NF-P04 | Post-pilot: potentielle krav til 99,9% SLA og multi-node/cluster | Should Have | Senere |

### 2.3 Support og Drift

| ID | Krav | Prioritet | Fase |
|----|------|-----------|------|
| NF-D01 | 1st level support håndteres af TAMU/Bridge Consulting | Must Have | Pilot |
| NF-D02 | 2nd level support skal håndteres af leverandør med reaktion samme dag i normal arbejdstid | Must Have | Pilot |
| NF-D03 | Ved kritiske fejl i survey-vindue forventes reaktionstid indenfor 2 timer | Must Have | Pilot |
| NF-D04 | Løsningen skal være designet så almindelige fejl kan logges og findes | Must Have | Pilot |
| NF-D05 | Daglig backup af database i pilotperioden | Must Have | Pilot |
| NF-D06 | Beskrivelse af gendannelsesproces og praktisk test | Must Have | Pilot |

### 2.4 Skalerbarhed og Arkitektur

| ID | Krav | Prioritet | Fase |
|----|------|-----------|------|
| NF-A01 | Single-server/single-instans løsning er OK i pilot, men arkitektur skal være forberedt til skalering | Must Have | Pilot |
| NF-A02 | Arkitekturen skal kunne udvides til flere skoler/institutioner uden omskrivning af kernesystemet | Must Have | Pilot |
| NF-A03 | Løsningen skal understøtte klar logisk adskillelse af data pr. skole/institution | Must Have | Pilot |
| NF-A04 | Løsningen skal leveres som containeriseret setup (fx Docker-kompatibelt) | Must Have | Pilot |

### 2.5 Teknologi

| ID | Krav | Prioritet | Fase |
|----|------|-----------|------|
| NF-T01 | Mobil-først responsiv webapp (PWA) til elever | Must Have | Pilot |
| NF-T02 | Web-baseret dashboard til mentorer/FACT (primært PC) | Must Have | Pilot |
| NF-T03 | Backend/API-lag til håndtering af spørgeskema, scoring og regler | Must Have | Pilot |
| NF-T04 | Database til elevdata, svar og indsatslog | Must Have | Pilot |
| NF-T05 | Integration til SMS-gateway for udsendelse af links/koder | Must Have | Pilot |
| NF-T06 | Backend + database hostet i EU | Must Have | Pilot |
| NF-T07 | Notifikationer via SMS/e-mail (+ evt. web-push) | Must Have | Pilot |

---

## 3. User Stories

### 3.1 Elev User Stories

| ID | Som... | Vil jeg gerne... | Så jeg kan... | Prioritet |
|----|--------|------------------|---------------|-----------|
| US-E01 | Elev | modtage en SMS med link til ugens trivselstjek | nemt komme i gang med at besvare | Must Have |
| US-E02 | Elev | modtage en 2-faktor kode på min telefon | logge sikkert ind uden at huske brugernavn/adgangskode | Must Have |
| US-E03 | Elev | besvare 15 korte spørgsmål på en 1-5 skala | give et nuanceret billede af min trivsel | Must Have |
| US-E04 | Elev | gennemføre besvarelsen på under 1 minut | svare hurtigt uden at det tager for meget tid | Must Have |
| US-E05 | Elev | se en simpel kvittering efter besvarelse | vide at mine svar er registreret | Must Have |
| US-E06 | Elev | vide at mine svar kun deles med mit mentorteam | føle mig tryg ved at svare ærligt | Must Have |
| US-E07 | Elev | modtage påmindelser hvis jeg glemmer at svare | huske at deltage i trivselstjekket | Must Have |
| US-E08 | Elev | se min egen trivselsudvikling over tid | forstå hvordan jeg har det over tid | Should Have |
| US-E09 | Elev | chatte med min mentor i systemet | nemt komme i kontakt ved behov | Could Have |

**Acceptkriterier for US-E01:**
- Eleven modtager SMS hver uge på et fast tidspunkt (fx onsdag)
- SMS indeholder et unikt, personligt link
- Linket fører direkte til spørgeskemaet
- Linket er gyldigt i en defineret periode (fx 4 dage)

**Acceptkriterier for US-E02:**
- Efter klik på link modtager eleven SMS med 6-cifret kode
- Koden er gyldig i 10 minutter
- Efter korrekt kode er eleven logget ind
- Ved forkert kode 3 gange låses adgang midlertidigt

**Acceptkriterier for US-E03:**
- 15 spørgsmål vises fordelt på 5 kategorier
- Hvert spørgsmål har svarskala 1-5 med tydelige labels
- Eleven kan navigere frem og tilbage mellem spørgsmål
- Spørgsmålsformulering tilpasses elevens fase (indslusning/hovedforløb/udslusning)

**Acceptkriterier for US-E04:**
- Gennemsnitlig besvarelsestid < 60 sekunder
- Maksimalt 2-3 tryk pr. spørgsmål
- Ingen unødvendige mellemskærme

### 3.2 Mentor User Stories

| ID | Som... | Vil jeg gerne... | Så jeg kan... | Prioritet |
|----|--------|------------------|---------------|-----------|
| US-M01 | Mentor | se en liste over mine elever med farvekoder | hurtigt få overblik over trivselsstatus | Must Have |
| US-M02 | Mentor | klikke på en elev og se seneste scores pr. kategori | forstå hvor eleven har udfordringer | Must Have |
| US-M03 | Mentor | se historik over de sidste 4-6 målinger | spotte tendenser i elevens trivsel | Must Have |
| US-M04 | Mentor | få fremhævet elever med kritisk score | prioritere hvem der har brug for hurtig hjælp | Must Have |
| US-M05 | Mentor | få fremhævet elever med markant fald i trivsel | opdage forværring tidligt | Must Have |
| US-M06 | Mentor | få fremhævet elever med gentagen non-respons | følge op på elever der ikke svarer | Must Have |
| US-M07 | Mentor | logge indsatsstatus på en elev | dokumentere hvad jeg har gjort | Must Have |
| US-M08 | Mentor | modtage ugentlig notifikation om mine elevers status | holde mig opdateret | Must Have |
| US-M09 | Mentor | modtage akut notifikation ved kritisk score | reagere hurtigt på alvorlige situationer | Must Have |
| US-M10 | Mentor | tilføje kommentarer til mine indsatser | dokumentere kontekst og observationer | Should Have |
| US-M11 | Mentor | se hvilke indsatser der tidligere har virket for en elev | lære af tidligere erfaringer | Should Have |

**Acceptkriterier for US-M01:**
- Dashboard viser liste over alle mentorens elever
- Hver elev har farveindikator (grøn/gul/rød) baseret på seneste score
- Listen kan sorteres efter navn, farve eller seneste besvarelse
- Farver opdateres automatisk når nye besvarelser registreres

**Acceptkriterier for US-M04:**
- Elever med rød status fremhæves visuelt i listen
- Kritiske kategorier markeres specifikt
- Mentor kan filtrere til kun at vise kritiske elever
- Definition af "kritisk" følger den fagligt udviklede scoringsmodel

**Acceptkriterier for US-M07:**
- Mentor kan vælge status: "kontaktet", "samtale planlagt", "indsats igangsat", "afsluttet"
- Status gemmes med timestamp og mentor-ID
- Tidligere statusser kan ses i historik
- Status er synlig for relevante teammedlemmer

### 3.3 FACT/ACT/IPS Team User Stories

| ID | Som... | Vil jeg gerne... | Så jeg kan... | Prioritet |
|----|--------|------------------|---------------|-----------|
| US-T01 | FACT-medarbejder | se resultater og udvikling for elever jeg er tilknyttet | støtte mentoren i indsatsen | Must Have |
| US-T02 | FACT-medarbejder | modtage notifikation ved kritisk score hos mine elever | reagere hurtigt sammen med mentor | Must Have |
| US-T03 | FACT-medarbejder | se oversigt over høj-risiko elever | prioritere teamets indsats | Must Have |
| US-T04 | Kontaktperson | se gruppe-trivselsoversigt | forstå trivsel på tværs af gruppen | Should Have |
| US-T05 | Kontaktperson | modtage notifikation ved tidlige faresignaler | forebygge eskalering | Should Have |
| US-T06 | IPS-medarbejder | se kontaktlog for elever jeg arbejder med | koordinere med mentorer | Should Have |

**Acceptkriterier for US-T01:**
- FACT-medarbejder ser kun elever de er tilknyttet via team-relation
- Visning inkluderer samme data som mentor ser
- Adgang styres via rollebaseret adgangskontrol

**Acceptkriterier for US-T03:**
- Oversigt viser alle elever med rød status på tværs af teamets portefølje
- Sorteret efter sværhedsgrad/aktualitet
- Inkluderer seneste indsatsstatus fra mentor

### 3.4 Administrator User Stories

| ID | Som... | Vil jeg gerne... | Så jeg kan... | Prioritet |
|----|--------|------------------|---------------|-----------|
| US-A01 | Administrator | oprette nye elever i systemet | onboarde nye deltagere | Must Have |
| US-A02 | Administrator | redigere elevdata | holde stamdata opdateret | Must Have |
| US-A03 | Administrator | tilknytte elever til mentorer | sikre korrekt adgangsstyring | Must Have |
| US-A04 | Administrator | administrere grupper | organisere elever i relevante grupper | Must Have |
| US-A05 | Administrator | registrere deltagersamtykke | dokumentere at samtykke er givet | Must Have |
| US-A06 | Administrator | deaktivere/slette elever | håndtere udmeldte elever korrekt | Must Have |
| US-A07 | Administrator | oprette og administrere faglige brugere | give adgang til mentorer og teams | Must Have |
| US-A08 | Administrator | se audit-log over systemhandlinger | sikre sporbarhed | Should Have |

**Acceptkriterier for US-A01:**
- Administrator kan indtaste: navn, telefonnummer, fase (indslusning/hovedforløb/udslusning)
- Telefonnummer valideres
- Elev får automatisk genereret internt ID
- Mentor-tilknytning kan ske ved oprettelse eller efterfølgende

**Acceptkriterier for US-A05:**
- Samtykke-status kan registreres med dato
- Elever uden samtykke kan ikke modtage surveys
- Tilbagetrukket samtykke stoppers dataindsamling
- Samtykke-historik gemmes

### 3.5 Analytiker/Forsker User Stories

| ID | Som... | Vil jeg gerne... | Så jeg kan... | Prioritet |
|----|--------|------------------|---------------|-----------|
| US-D01 | CBS-forsker | eksportere anonymiserede trivselsdata | analysere mønstre på tværs af elever | Must Have |
| US-D02 | CBS-forsker | se kobling mellem trivselsscores og indsatser | evaluere effekt af interventioner | Must Have |
| US-D03 | CBS-forsker | få data med interne ID'er (ikke personhenførbare) | følge individuelle forløb anonymt | Must Have |
| US-D04 | Projektleder | se aggregerede nøgletal for hele projektet | rapportere til styregruppe | Should Have |

**Acceptkriterier for US-D01:**
- Eksport indeholder besvarelser, scores, tidsstempler
- Personhenførbare data (navn, telefon) er fjernet/pseudonymiseret
- Elever identificeres kun via internt ID
- Eksportformat er standard (CSV, JSON)

**Acceptkriterier for US-D02:**
- Data inkluderer: trivselsscore, kategori-scores, registrerede indsatser
- Tidsmæssig kobling muliggør før/efter-analyse
- Indsatstyper er kategoriseret ensartet

---

## 4. Feature-oversigt

### 4.1 Pilot-features (MVP - Uge 8)

| Feature | Beskrivelse | Brugergruppe |
|---------|-------------|--------------|
| SMS Survey Distribution | Ugentlig SMS med personligt link til spørgeskema | Elev |
| 2FA Authentication | To-faktor autentificering via SMS-kode | Elev, Mentor |
| 15-Question Survey | Spørgeskema med 5 kategorier og 1-5 skala | Elev |
| Phase-differentiated Questions | Spørgsmålsformulering tilpasset elevens fase | Elev |
| Simple Confirmation | Kvitteringsside efter besvarelse | Elev |
| Non-response Tracking | Registrering af manglende besvarelser | System |
| Reminder System | 1-2 påmindelser ved manglende svar | Elev |
| Mentor Dashboard | Overblik over elever med farvekoder | Mentor |
| Student Detail View | Scores pr. kategori og historik | Mentor |
| Risk Indicators | Fremhævning af kritiske scores, fald, non-respons | Mentor |
| Intervention Log | Simpel statusregistrering på elever | Mentor |
| Notification System | SMS/APP notifikationer ved kritiske hændelser | Mentor, Team |
| Scoring Engine | Beregning af kategori- og samlet score | System |
| Traffic Light System | Grøn/gul/rød farvekodning baseret på tærskler | System |
| User Administration | Oprettelse og vedligeholdelse af elever og brugere | Admin |
| Consent Management | Registrering af deltagersamtykke | Admin |
| Role-based Access | Adgangsstyring baseret på roller | System |
| Data Export | Anonymiseret dataeksport til CBS | Analytiker |

### 4.2 Senere faser

| Feature | Beskrivelse | Brugergruppe |
|---------|-------------|--------------|
| Student Self-view | Elevens egen trivselsudvikling over tid | Elev |
| In-app Chat | Beskedfunktion mellem elev og fagpersoner | Elev, Mentor |
| Peer Groups | Gruppefunktioner for elever | Elev |
| Targeted Feedback | Personlig feedback til elever | Elev |
| Advanced Intervention Log | Detaljeret log med kommentarer | Mentor |
| Feedback Module | Struktureret feedback til elever | Mentor |
| Group Overview | Trivselsoversigt på gruppeniveau | Kontaktperson |
| Early Warning Signals | Avancerede regler for tidlige faresignaler | Team |
| Contact Log | Delt kontaktlog på tværs af team | Team |
| Peer Group Facilitation | Værktøjer til at facilitere peer-grupper | Team |
| Automatic User Sync | Integration til stamdata-systemer | Admin |
| Advanced Dashboards | Rapporter på tværs af afdelinger | Ledelse |
| Self-service Configuration | UI til konfiguration af spørgeramme og tærskler | Admin |
| System Integrations | Integration til fagsystemer | System |
| Native Apps | iOS/Android apps med bedre push-notifikationer | Elev |

---

## 5. Datamodel (Konceptuel)

### 5.1 Primære Entiteter

**Elev (Student)**
- ID (internt, pseudonymiseret)
- Navn
- Telefonnummer
- Fase (indslusning/hovedforløb/udslusning)
- Samtykke-status
- Samtykke-dato
- Oprettelsesdato
- Status (aktiv/inaktiv)

**Bruger (User)**
- ID
- Brugernavn
- Telefonnummer (til 2FA)
- Rolle (mentor/FACT/admin/analytiker)
- Organisation

**Besvarelse (Response)**
- ID
- Elev-ID
- Uge/dato
- Spørgsmål-ID
- Svar (1-5)
- Tidsstempel

**Score**
- ID
- Elev-ID
- Uge/dato
- Kategori (Trivsel/Motivation/Fællesskab/Selvindsigt/Arbejdsparathed)
- Score-værdi
- Samlet trivselsscore
- Farve (grøn/gul/rød)

**Indsats (Intervention)**
- ID
- Elev-ID
- Bruger-ID
- Status (kontaktet/samtale planlagt/indsats igangsat/afsluttet)
- Kommentar
- Tidsstempel

**Notifikation (Notification)**
- ID
- Elev-ID
- Bruger-ID
- Type (kritisk score/fald/non-respons)
- Sendt-tidsstempel
- Kanal (SMS/APP)

**Tilknytning (Assignment)**
- Elev-ID
- Bruger-ID
- Rolle (primær mentor/team-medlem)

**Gruppe (Group)**
- ID
- Navn
- Beskrivelse

---

## 6. Integrationer

### 6.1 Pilot-integrationer

| Integration | Formål | Retning |
|-------------|--------|---------|
| SMS Gateway | Udsendelse af survey-links og 2FA-koder | Udgående |
| SMS Gateway | Notifikationer til mentorer | Udgående |

### 6.2 Fremtidige integrationer

| Integration | Formål | Retning |
|-------------|--------|---------|
| Identity Provider (IdP) | Single Sign-On for faglige brugere | Indgående |
| TAMU Stamdata | Automatisk elevoprettelse/vedligeholdelse | Indgående |
| Push Notification Service | Native app-notifikationer | Udgående |

---

## 7. Test og Acceptkriterier

### 7.1 Systemtest (Uge 7)

| Testområde | Testbeskrivelse |
|------------|-----------------|
| Elevflow E2E | Komplet flow fra SMS til besvarelse til kvittering |
| Mentorflow E2E | Login, dashboard, elevdetaljer, indsatsregistrering |
| Scoring | Korrekt beregning af kategori- og samlet score |
| Farvekodning | Korrekt tildeling af grøn/gul/rød baseret på tærskler |
| Notifikationer | Korrekt udsendelse ved kritisk score, fald, non-respons |
| Adgangsstyring | Mentor ser kun egne elever |
| 2FA | Korrekt flow for autentificering |
| Non-respons | Registrering og påmindelser ved manglende svar |

### 7.2 Performance og Sikkerhedstest

| Testområde | Krav |
|------------|------|
| Response time | Sider indlæses på < 3 sekunder |
| Concurrent users | Systemet håndterer 50 samtidige brugere |
| HTTPS | Al trafik er krypteret |
| Data-at-rest | Database er krypteret |
| Access control | Uautoriseret adgang afvises |

### 7.3 GDPR-validering

| Valideringsområde | Tjekpunkt |
|-------------------|-----------|
| Samtykke-flow | Elever giver aktivt samtykke før dataindsamling |
| Dataminimering | Kun nødvendige data indsamles |
| Adgangsbegrænsning | Data kun tilgængelig for autoriserede |
| Eksport | Anonymiseret data til CBS |
| Sletning | Data kan slettes ved tilbagetrukket samtykke |

---

## 8. Leverancer ved Pilot-start (Uge 8)

### 8.1 Software
- Pilotløsning testet og driftklar
- Test- og produktionsmiljøer i drift
- Daglig backup opsat
- Brugere oprettet og løsning klar til ibrugtagning

### 8.2 Dokumentation
- Kort teknisk løsningsbeskrivelse (arkitektur, komponenter)
- Kort driftsvejledning (miljøopsætning, genstart, backup/gendannelse)
- Kort brugervejledning til mentorer/FACT
- Kort brugervejledning til elever (videodemo)

### 8.3 Support
- 4 ugers stabiliseringsperiode efter go-live
- Leverandør til rådighed for fejlrettelser
- Fokus på brugbar pilotdata for pædagogik og forskning

---

## 9. Risici og Mitigering

| Risiko | Sandsynlighed | Konsekvens | Mitigering |
|--------|---------------|------------|------------|
| Teknisk platform ikke robust nok (erfaring fra tidligere projekt) | Medium | Høj | Fokus på robusthed, drift og enkelhed. Fit-for-purpose løsning frem for tilpasning af standardløsning |
| Lav svarprocent blandt elever | Medium | Høj | Simpelt, hurtigt flow. Non-respons som datapunkt. Påmindelser |
| Manglende tillid fra elever | Medium | Høj | Trygt sprog, klar kommunikation om datahåndtering, kun mentor ser svar |
| Forsinkelse i leverandørvalg | Medium | Medium | Tidlig kontakt til potentielle leverandører (december 2025) |
| GDPR-compliance udfordringer | Lav | Høj | Privacy by design, tidlig GDPR-validering, klar samtykkeproces |

---

## 10. Ordliste

| Term | Definition |
|------|------------|
| TAMU | Den Militære Arbejdstræningsuddannelse |
| FACT | Flexible Assertive Community Treatment - tværfagligt team |
| ACT | Assertive Community Treatment |
| IPS | Individual Placement and Support |
| CBS | Copenhagen Business School |
| PWA | Progressive Web App |
| OTP | One-Time Password (engangskode) |
| IdP | Identity Provider |
| Non-respons | Manglende besvarelse af ugentligt spørgeskema |
| Trivselsscore | Samlet score beregnet på baggrund af 15 spørgsmål |
| Farvekodning | Grøn/gul/rød indikator baseret på tærskler |

---

*Dokument udarbejdet på baggrund af projektbeskrivelse dateret 19. november 2025*