# Reference resources per vehicle (historical)

> **Historical (milestone 43):** the GLBs and photos described here were **removed from `public/models`** when the unused assets were cleaned up. This file stays as a record of where they came from and under what licence. They can be recovered from git history (`git log --diff-filter=D -- public/models`).

They were material to **build the procedural vehicles** (`src/lib/vehicles/<id>.ts`): reference for proportions and detail. Nothing of this is loaded by the app.

| Vehicle | 3D model | Reference photos | Outcome |
| --- | --- | --- | --- |
| Opportunity | `opportunity.glb` (supplied by the owner) | — | Covered |
| Spirit | NASA's `MER static (24883).glb` (12 MB) + a zip supplied by the owner (only a 12 MB `.blend`) | 8 | **Covered**: NASA's official model is the **generic MER** (Spirit and Opportunity are identical; only the colour/marking choices differ) |
| Ingenuity | `Ingenuity Mars Helicopter.glb` (supplied by the owner, 2 MB, Draco) | — | **Covered** |
| InSight | NASA's `InSight Cruise Lander (arm deployed).glb` (3.9 MB, Draco) and `InSight deployed (24880).glb` (22 MB) | 9 | **Covered** (the model is the landing configuration: arm and panels deployed; without the seismometer and the mole on the ground) |
| Beagle 2 | **none exists** | 5 NASA/HiRISE orbital + 6 of real replicas and mock-ups (Wikimedia Commons) | **No 3D model**: none is downloadable; drawn by hand from the replica photos |
| SEV, Perseverance | `sev.glb`, `perseverance.glb` (supplied by the owner) | — | Covered |
| Surveyor 3 | none; built from photos (Apollo 12 photo AS12-48-7133, NASA/JSC; the National Air and Space Museum's engineering model) | — | Covered |

## Where each thing was downloaded

- **NASA models (public domain):** [NASA 3D Resources](https://science.nasa.gov/3d-resources/) — [InSight Cruise Lander](https://science.nasa.gov/3d-resources/insight-cruise-lander), [InSight Lander, 3D model](https://science.nasa.gov/resource/insight-lander-3d-model/), [Mars Exploration Rover](https://science.nasa.gov/3d-resources/mars-exploration-rover-spirit-and-opportunity/). Credit: NASA/JPL-Caltech.
- **NASA photos (public domain):** [images.nasa.gov](https://images.nasa.gov) (`PIAxxxxx` ids), downloaded with the public API. Credit: NASA/JPL-Caltech, or NASA/JPL-Caltech/University of Arizona/University of Leicester for the Beagle 2 ones.
- **Photos of Beagle 2 replicas:** [Wikimedia Commons](https://commons.wikimedia.org). **They are not public domain**: CC BY / CC BY-SA, with author and licence recorded when they were downloaded. They served as internal reference; if one were ever shown in the demo, author and licence must be cited.
- Model-selling pages (CGTrader, Sketchfab, 3D Warehouse) were **not used**: they require an account or their own licence.

## What was not found (Beagle 2)

There is no downloadable 3D model from ESA, the UK Space Agency or NASA. Full-scale replicas exist (the Science Museum in London, the Spaceport in Liverpool, the Space Centre in Leicester) and a very precise model built by De Montfort University to analyse the failure, with no known public link. The vehicle was drawn from photos: a circular gold lid (the "shell"), the central base with the yellow calibration frame, an articulated arm and **four circular solar panels** that open like petals.
