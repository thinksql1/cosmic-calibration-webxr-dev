# Constellation Catalog V3A source and connectivity review

## Scope and method

V3A adds exactly UMI, CNC, CVN, COM, CRV, CRT, MON, LEP, DEL, SGE, and TRI to the accepted V2 29-figure study. The prior expansion task stopped correctly: it would not invent coordinates, import an unlicensed connectivity array, substitute figures, or weaken the BSC5P provenance policy. This review completes that missing research using NASA HEASARC's public-domain Bright Star Catalogue 5th Revised Edition preliminary records (BSC5P) in EQJ/J2000. RA below is sidereal hours converted from the returned BSC5P degrees; declination and V magnitude are the returned BSC5P values. `New` means new to V3A; no V2 coordinate record is copied or replaced. Bayer/Flamsteed text is read from BSC5P `alt_name`; no secondary coordinate source was used.

Connectivity is original project-authored instructional design, not an IAU standard or a third-party table. Every segment is reviewed below and is rendered as an immutable minor great-circle arc at at most 1.5 degrees.

| Figure | Instructional purpose | Stars | Segments | Source / review status |
|---|---:|---:|---:|---|
| UMI Ursa Minor | North Star orientation | 7 | 7 | BSC5P verified / complete |
| CNC Cancer | completes zodiac | 5 | 4 | BSC5P verified / complete |
| CVN Canes Venatici | spring navigation | 2 | 1 | BSC5P verified / complete |
| COM Coma Berenices | restrained cluster region | 3 | 2 | BSC5P verified / complete |
| CRV Corvus | compact spring quadrilateral | 4 | 4 | BSC5P verified / complete |
| CRT Crater | cup-like neighbor | 4 | 4 | BSC5P verified / complete |
| MON Monoceros | Orion-neighborhood structure | 5 | 4 | BSC5P verified / complete |
| LEP Lepus | true-sky Orion neighbor | 6 | 6 | BSC5P verified / complete |
| DEL Delphinus | compact summer figure | 5 | 5 | BSC5P verified / complete |
| SGE Sagitta | minimal arrow | 4 | 4 | BSC5P verified / complete |
| TRI Triangulum | autumn triangle | 3 | 3 | BSC5P verified / complete |

## Star audit

All rows are `New`, primary source `NASA HEASARC BSC5P HR <n>`, frame `EQJ_J2000`, epoch `J2000.0`, and have no required secondary confirmation. Proper names are recorded only where they are customary; the BSC5P Bayer/Flamsteed identifier remains the stable identity.

| Figure | Project ID / HR | Bayer or Flamsteed / proper name | RA h | Dec deg | V mag |
|---|---|---|---:|---:|---:|
| UMI | BSC5P-HR-424 | α UMi / Polaris | 2.53019333 | 89.2642 | 2.02 |
| UMI | BSC5P-HR-6789 | δ UMi / Yildun | 17.53691333 | 86.5864 | 4.36 |
| UMI | BSC5P-HR-6322 | ε UMi | 16.76614000 | 82.0372 | 4.23 |
| UMI | BSC5P-HR-5903 | ζ UMi | 15.73430667 | 77.7944 | 4.32 |
| UMI | BSC5P-HR-6116 | η UMi | 16.29175333 | 75.7553 | 4.95 |
| UMI | BSC5P-HR-5735 | γ UMi / Pherkad | 15.34547333 | 71.8339 | 3.05 |
| UMI | BSC5P-HR-5563 | β UMi / Kochab | 14.84508667 | 74.1556 | 2.08 |
| CNC | BSC5P-HR-3249 | β Cnc / Altarf | 8.27525333 | 9.1856 | 3.52 |
| CNC | BSC5P-HR-3449 | γ Cnc / Asellus Borealis | 8.72141333 | 21.4686 | 4.66 |
| CNC | BSC5P-HR-3461 | δ Cnc / Asellus Australis | 8.74474667 | 18.1542 | 3.94 |
| CNC | BSC5P-HR-3475 | ι Cnc | 8.77828000 | 28.7600 | 4.02 |
| CNC | BSC5P-HR-3572 | α Cnc / Acubens | 8.97478000 | 11.8578 | 4.25 |
| CVN | BSC5P-HR-4915 | α² CVn / Cor Caroli | 12.93380667 | 38.3183 | 2.90 |
| CVN | BSC5P-HR-4785 | β CVn / Chara | 12.56236000 | 41.3575 | 4.26 |
| COM | BSC5P-HR-4737 | γ Com | 12.44897333 | 28.2683 | 4.36 |
| COM | BSC5P-HR-4968 | α Com / Diadem | 13.16647333 | 17.5294 | 5.22 |
| COM | BSC5P-HR-4983 | β Com | 13.19788667 | 27.8781 | 4.26 |
| CRV | BSC5P-HR-4630 | ε Crv / Minkar | 12.16874667 | -22.6197 | 3.00 |
| CRV | BSC5P-HR-4662 | γ Crv / Gienah | 12.26344667 | -17.5419 | 2.59 |
| CRV | BSC5P-HR-4757 | δ Crv / Algorab | 12.49774667 | -16.5156 | 2.95 |
| CRV | BSC5P-HR-4786 | β Crv / Kraz | 12.57311333 | -23.3967 | 2.65 |
| CRT | BSC5P-HR-4287 | α Crt / Alkes | 10.99625333 | -18.2989 | 4.08 |
| CRT | BSC5P-HR-4343 | β Crt | 11.19430667 | -22.8258 | 4.48 |
| CRT | BSC5P-HR-4382 | δ Crt / Labrum | 11.32236000 | -14.7786 | 3.56 |
| CRT | BSC5P-HR-4405 | γ Crt | 11.41469333 | -17.6839 | 4.08 |
| MON | BSC5P-HR-2227 | γ Mon | 6.24758667 | -6.2747 | 3.98 |
| MON | BSC5P-HR-2356 | β Mon | 6.48028000 | -7.0328 | 4.60 |
| MON | BSC5P-HR-2714 | δ Mon | 7.19774667 | -0.4928 | 4.15 |
| MON | BSC5P-HR-2970 | α Mon | 7.68744667 | -9.5511 | 3.93 |
| MON | BSC5P-HR-3188 | ζ Mon | 8.14322000 | -2.9839 | 4.34 |
| LEP | BSC5P-HR-1654 | ε Lep | 5.09102667 | -22.3711 | 3.19 |
| LEP | BSC5P-HR-1829 | β Lep / Nihal | 5.47074667 | -20.7594 | 2.84 |
| LEP | BSC5P-HR-1865 | α Lep / Arneb | 5.54550000 | -17.8222 | 2.58 |
| LEP | BSC5P-HR-1983 | γ Lep | 5.74105333 | -22.4483 | 3.60 |
| LEP | BSC5P-HR-1998 | ζ Lep | 5.78258000 | -14.8219 | 3.55 |
| LEP | BSC5P-HR-2035 | δ Lep | 5.85536000 | -20.8792 | 3.81 |
| DEL | BSC5P-HR-7852 | ε Del | 20.55355333 | 11.3033 | 4.03 |
| DEL | BSC5P-HR-7882 | β Del / Rotanev | 20.62583333 | 14.5953 | 3.63 |
| DEL | BSC5P-HR-7906 | α Del / Sualocin | 20.66064000 | 15.9119 | 3.77 |
| DEL | BSC5P-HR-7928 | δ Del | 20.72430667 | 15.0744 | 4.43 |
| DEL | BSC5P-HR-7948 | γ² Del | 20.77764000 | 16.1242 | 4.27 |
| SGE | BSC5P-HR-7479 | α Sge / Sham | 19.66828000 | 18.0139 | 4.37 |
| SGE | BSC5P-HR-7488 | β Sge | 19.68414000 | 17.4761 | 4.37 |
| SGE | BSC5P-HR-7536 | δ Sge | 19.78980667 | 18.5342 | 3.82 |
| SGE | BSC5P-HR-7635 | γ Sge | 19.97928000 | 19.4922 | 3.47 |
| TRI | BSC5P-HR-544 | α Tri / Mothallah | 1.88469333 | 29.5789 | 3.41 |
| TRI | BSC5P-HR-622 | β Tri | 2.15905333 | 34.9872 | 3.00 |
| TRI | BSC5P-HR-664 | γ Tri | 2.28858667 | 33.8472 | 4.01 |

## Connectivity review

| Figure | Project-authored segments (HR) | Visual role and rationale | Alternatives rejected |
|---|---|---|---|
| UMI | 424–6789–6322–5903; 5903–6116–5735–5563–5903 | Polaris is the handle endpoint; last four edges make the bowl. | Any UMi–UMa bridge; a closed handle. |
| CNC | 3572–3449–3461–3249; 3449–3475 | low-prominence zigzag and northern branch | dense crab/web or brightness override |
| CVN | 4915–4785 | principal bright pair | figurative hunting-dog drawing |
| COM | 4737–4983–4968 | compact open cluster-region trace | a false closed cluster boundary |
| CRV | 4630–4662–4757–4786–4630 | compact quadrilateral | Crater/Hydra connections |
| CRT | 4287–4343–4405–4382–4287 | restrained cup | Corvus/Hydra connections |
| MON | 2227–2356–2970–3188–2714 | sparse central route | Orion attachment or dense unicorn |
| LEP | 1654–1829–1865–1998; 1829–1983–2035–1865 | compact body/ears below Orion | rotated textbook layout; Orion attachment |
| DEL | 7906–7882–7928–7948–7906; 7882–7852 | diamond core plus extension | dense dolphin drawing |
| SGE | 7479–7488–7536–7635; 7488–7635 | shaft, head, and feathered tail | unnecessary closure/web |
| TRI | 544–622–664–544 | conventional triangle | internal decorative line |

Validation status: implemented source metadata and connectivity pass focused automated integrity tests. Human review is supported by the `course-40` canonical EQJ and real-sky diagnostics; physical Quest review remains pending. V3B remains deferred: Hydra, Eridanus, Serpens, Cetus, Vulpecula, Lacerta, Equuleus, Scutum, Lupus, and Crux. Labels, the Milky Way, Galactic Center, and the deferred lunar observations are also out of scope.
