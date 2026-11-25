# Data sources – mobility page (`/mobilitaet`)

Which chart reads which data from where, and how the data gets there.
All new data lives in **Directus** (base.klimadashboard.org); no chart reads local CSV files.
Import/sync scripts belong in the **flow** repository (`klimadashboard/flow`).

## Overview

| Chart (`custom_sveltestring`) | Directus collection | Filter / content | Original source | How it gets into Directus |
|---|---|---|---|---|
| `emissionsDetailedSectors` (treemap, option `{"sector":"traffic"}`) | existing emissions collections | – | Umweltbundesamt | existing |
| `emissionsFederalStatesExplorer` | `emissions_data`, `population` | source `BLI 2025 (1990-2023)`, type `Gesamt`, country AT | Umweltbundesamt, Bundesländer-Luftschadstoff-Inventur | existing |
| `mobilityMap` (ÖV-Güteklassen) | existing | – | ÖROK ÖV-Güteklassen | existing |
| `newRegistrationsOverview` → Pkw view (`newCarRegistrationsExplorer`) | **`vehicle_registrations`** | `vehicle_class = passenger_car_m1`, region Österreich | Statistik Austria, Kfz-Statistik: Fahrzeug-Neuzulassungen, **Tabelle 2** (Pkw nach Kraftstoffart, with plug-in split) | `flow/manual/statistik-austria-vehicle-registrations-import.mjs` (after each new monthly file) |
| `newRegistrationsOverview` → Lkw / Busse views (`newTruckRegistrationsExplorer`) | **`vehicle_registrations`** | `vehicle_class` in `truck_n1`, `truck_n2`, `truck_n3`, `semi_trailer_tractor` / `bus_m2_m3` | Statistik Austria, Kfz-Statistik: **Kfz-Neuzulassungen nach Bundesland und Kraftstoffart bzw. Energiequelle** (no plug-in split) | same script |
| `bevShareInternational` („Aber China“) | **`car_registrations_international`** + Austria from **`vehicle_registrations`** | international: all countries except Austria; Austria: `passenger_car_m1` | Robbie Andrew, Collected vehicle registration data (CC BY 4.0), https://robbieandrew.github.io/carsales/ | `flow/automated/carsales-international-weekly-sync.mjs` (crontab, weekly) |
| `mobilityRenewableShare` | existing `mobility` | `category = share_renewable` | Eurostat SHARES (`nrg_ind_ren`, REN_TRA); EU target: Richtlinie (EU) 2023/2413 | existing |
| road deaths chart (planned, `/mobilitaet/fahrrad`) | **`road_accidents`** | e.g. `breakdown = transport_mode`, `measure = killed` | Statistik Austria, Statistik der Straßenverkehrsunfälle, STATreport Tabellenteil (T1, T7, T29, T49, T37, T39, T41) | `flow/manual/statistik-austria-road-accidents-import.mjs` (once a year) |

## New collections

### `vehicle_registrations`
New vehicle registrations in Austria by vehicle class and fuel type, long format.

`region` (→ regions) · `date` · `year` · `month` · `vehicle_class` · `fuel_type` · `parent_fuel_type` · `period` (`month` / `year_to_date`) · `value` · `unit` (`vehicles`) · `source`

- Two sources in one table, distinguishable by `source`:
  - **Tabelle 2** – passenger cars, Austria only, monthly from 2018, `year_to_date` for every month, plug-in hybrids as subsets
    (`petrol_plugin_hybrid` / `diesel_plugin_hybrid`, `parent_fuel_type` set – **do not add them up**), plus `fuel_type = total`.
  - **Bundesland/Kraftstoff file** – all vehicle classes, Austria + 9 federal states, monthly from 2025, `year_to_date` only for the
    latest month of each year (2024: annual values only); hybrids include plug-in hybrids; no `total` row.
- Austria / passenger cars exist only once (from Tabelle 2).

### `road_accidents`
`region` (→ regions) · `year` · `breakdown` (`total`, `federal_state`, `transport_mode`, `age_group`) · `category` · `accident_involving`
(`heavy_truck` / `light_truck` / `bus`, else empty) · `measure` (`accidents`, `injured`, `killed`) · `value` · `unit` · `source`

- Killed = died within 30 days. Changed survey method from 2012 (no direct comparison with earlier years).
- E-scooters separate from 2023 (before part of bicycle).
- Rows with `accident_involving` are subsets (casualties of accidents in which such a vehicle was involved).

### `car_registrations_international`
`state` (ISO 3166-1 alpha-2; `US-CA` California, `EU`, `EU_EFTA_UK`) · `date` · `year` · `month` · `fuel_type` · `value` · `unit` · `source`

- Without Austria (→ `vehicle_registrations`; the numbers are identical).
- `fuel_type` in the same snake_case keys as `vehicle_registrations` where the meaning is the same (`electric`, `petrol`, `diesel`, …),
  plus `plugin_hybrid`, `non_plugin_hybrid`, `hybrid` (plug-in and non-plug-in not separated), `internal_combustion`
  (combustion not split by fuel, e.g. China), `mild_hybrid`, `lpg`, `ethanol`, `hydrogen`, `other`.
- Synced weekly; only countries whose data changed are replaced.

All three collections need **public read** permission (the site reads Directus without a token); the scripts set it.

## Not from Directus (yet)
- Car stock by fuel type (`carsTypes`, `carsHistoric…`): Austria only has `Hybrid` without plug-in split in the source data
  (Statistik Austria Bestand by district 2014/2019/2024).
