# Constellation Catalog V3B source and connectivity review

## Scope and source method

V3B appends exactly HYA, ERI, CET, VUL, LAC, EQU, SCT, SER, LUP, and CRU to the immutable Course-40 catalog. The primary coordinate source for every listed record is NASA HEASARC BSC5P, public-domain U.S. Government data, queried as `hr`, `alt_name`, `ra`, `dec`, and `vmag`. RA is the returned degree value divided by 15; frame is `EQJ_J2000`, epoch is `J2000.0`, and proper motion remains intentionally omitted. All 101 records below are **New** canonical V3B records: the V2/V3A catalog identifiers were audited first and no duplicate coordinate record was added. The implementation record in `src/science/constellations/brightStarCatalogV3B.ts` is the complete source-backed canonical record table.

Connectivity is original project-authored conventional Western instructional design, not an IAU boundary or standardized line figure and not an imported third-party connectivity table. Every rendered edge is a minor great-circle arc sampled at no more than 1.5 degrees.

| Figure | Instructional purpose | Stars | Segments | Source / review status |
|---|---|---:|---:|---|
| HYA Hydra | long open orientation route | 19 | 18 | BSC5P verified / open topology complete |
| ERI Eridanus | long open river route | 24 | 23 | BSC5P verified / open topology complete |
| CET Cetus | restrained autumn sweep | 9 | 8 | BSC5P verified / open topology complete |
| VUL Vulpecula | compact summer trace | 6 | 5 | BSC5P verified / complete |
| LAC Lacerta | northern compact zigzag | 7 | 6 | BSC5P verified / complete |
| EQU Equuleus | compact three-anchor head | 3 | 3 | BSC5P verified / complete |
| SCT Scutum | small open shield | 7 | 6 | BSC5P verified / complete |
| SER Serpens | Caput and Cauda, one code | 14 | 12 | BSC5P verified / two components complete |
| LUP Lupus | compact southern route | 8 | 7 | BSC5P verified / complete |
| CRU Crux | canonical cross bars | 5 | 2 | BSC5P verified / horizon-independent catalog inclusion |

## Star audit

Format: `BSC5P-HR (BSC5P designation; RA hours; Dec degrees; V magnitude)`. Every row is `New`, source `NASA HEASARC BSC5P HR <n>`, and needs no secondary coordinate confirmation.

| Figure | Audited canonical records |
|---|---|
| HYA | 3410 (4 Del Hya; 8.62761333; 5.7036; 4.16); 3418 (5 Sig Hya; 8.64594667; 3.3414; 4.44); 3454 (7 Eta Hya; 8.72041333; 3.3986; 4.30); 3482 (11 Eps Hya; 8.77961333; 6.4189; 3.38); 3547 (16 Zet Hya; 8.92322000; 5.9456; 3.11); 3665 (22 The Hya; 9.23941333; 2.3142; 3.88); 3748 (30 Alp Hya / Alphard; 9.45978000; -8.6586; 1.98); 3903 (39 Ups1 Hya; 9.85797333; -14.8467; 4.12); 3994 (41 Lam Hya; 10.17647333; -12.3542; 3.61); 4094 (42 Mu Hya; 10.43483333; -16.8364; 3.81); 4232 (Nu Hya; 10.82708000; -16.1936; 3.11); 4314 (Chi1 Hya; 11.08886000; -27.2936; 4.94); 4450 (Xi Hya; 11.55002667; -31.8578; 3.54); 4494 (Omi Hya; 11.67022000; -34.7447; 4.70); 4552 (Bet Hya; 11.88183333; -33.9081; 4.28); 4958 (45 Psi Hya; 13.15091333; -23.1181; 4.95); 5020 (46 Gam Hya; 13.31536000; -23.1717; 3.00); 5287 (49 Pi Hya; 14.10619333; -26.6825; 3.27); 5526 (58 Hya; 14.83814000; -27.9603; 4.41) |
| ERI | 1666 (67 Bet Eri; 5.13083333; -5.0864; 2.79); 1679 (69 Lam Eri; 5.15244667; -8.7542; 4.27); 1617 (65 Psi Eri; 5.02397333; -7.1739; 4.81); 1560 (61 Ome Eri; 4.88158000; -5.4528; 4.39); 1520 (57 Mu Eri; 4.75836000; -3.2547; 4.02); 1463 (48 Nu Eri; 4.60530667; -3.3525; 3.93); 1325 (40 Omi2 Eri; 4.25452667; -7.6528; 4.43); 1298 (38 Omi1 Eri; 4.19775333; -6.8375; 4.04); 1231 (34 Gam Eri; 3.96716667; -13.5086; 2.95); 1162 (26 Pi Eri; 3.76902667; -12.1017; 4.42); 1136 (23 Del Eri; 3.72080667; -9.7633; 3.54); 1084 (18 Eps Eri; 3.54883333; -9.4583; 3.73); 984 (13 Zet Eri; 3.26388667; -8.8197; 4.80); 917 (9 Rho2 Eri; 3.04508667; -7.6853; 5.32); 874 (3 Eta Eri; 2.94047333; -8.8981; 3.89); 850 (2 Tau2 Eri; 2.85064000; -21.0042; 4.75); 919 (11 Tau3 Eri; 3.03986000; -23.6244; 4.09); 883 (4 Eri; 2.95658667; -23.8619; 5.45); 897 (The1 Eri; 2.97102667; -40.3047; 3.24); 794 (Iot Eri; 2.67778000; -39.8556; 4.11); 721 (Kap Eri; 2.44975333; -47.7039; 4.25); 674 (Phi Eri; 2.27516667; -51.5122; 3.56); 566 (Chi Eri; 1.93264000; -51.6089; 3.70); 472 (Alp Eri / Achernar; 1.62858000; -57.2367; 0.46) |
| CET | 188 (16 Bet Cet / Diphda; 0.72650000; -17.9867; 2.04); 48 (7 Cet; 0.24400000; -18.9328; 4.44); 74 (8 Iot Cet; 0.32380667; -8.8239; 3.56); 334 (31 Eta Cet; 1.14316667; -10.1822; 3.45); 402 (45 The Cet; 1.40038667; -8.1833; 3.60); 539 (55 Zet Cet; 1.85766667; -10.3350; 3.73); 681 (68 Omi Cet; 2.32242000; -2.9775; 3.04); 804 (86 Gam Cet; 2.72166667; 3.2358; 3.47); 911 (92 Alp Cet / Menkar; 3.03800000; 4.0897; 2.53) |
| VUL | 7306 (1 Vul; 19.27028000; 21.3903; 4.77); 7405 (6 Alp Vul / Anser; 19.47841333; 24.6650; 4.44); 7592 (13 Vul; 19.89102667; 24.0797; 4.58); 7744 (23 Vul; 20.26280667; 27.8142; 4.52); 7891 (29 Vul; 20.64202667; 21.2011; 4.82); 7995 (31 Vul; 20.86880667; 27.0969; 4.59) |
| LAC | 8498 (1 Lac; 22.26616667; 37.7489; 4.13); 8523 (2 Lac; 22.35044667; 46.5367; 4.57); 8538 (3 Bet Lac; 22.39266667; 52.2292; 4.43); 8585 (7 Alp Lac; 22.52152667; 50.2825; 3.77); 8572 (5 Lac; 22.49216667; 47.7069; 4.36); 8579 (6 Lac; 22.50814000; 43.1233; 4.51); 8622 (10 Lac; 22.65436000; 39.0503; 4.88) |
| EQU | 8097 (5 Gam Equ; 21.17236000; 10.1317; 4.69); 8123 (7 Del Equ; 21.24136000; 10.0069; 4.49); 8131 (8 Alp Equ / Kitalpha; 21.26372000; 5.2478; 3.92) |
| SCT | 6884 (Zet Sct; 18.39430667; -8.9342; 4.68); 6930 (Gam Sct; 18.48664000; -14.5658; 4.70); 6973 (Alp Sct; 18.58678000; -8.2442; 3.85); 7020 (Del Sct; 18.70455333; -9.0525; 4.72); 7032 (Eps Sct; 18.72536000; -8.2753; 4.90); 7063 (Bet Sct; 18.78625333; -4.7478; 4.22); 7149 (Eta Sct; 18.95102667; -5.8461; 4.83) |
| SER | 5788 (13 Del Ser; 15.58002667; 10.5375; 3.80); 5842 (21 Iot Ser; 15.69252667; 19.6703; 4.52); 5854 (24 Alp Ser / Unukalhai; 15.73780667; 6.4256; 2.65); 5867 (28 Bet Ser; 15.76980667; 15.4219; 3.67); 5868 (27 Lam Ser; 15.77405333; 7.3531; 4.43); 5879 (35 Kap Ser; 15.81233333; 18.1417; 4.09); 5892 (37 Eps Ser; 15.84694667; 4.4778; 3.71); 5933 (41 Gam Ser; 15.94088667; 15.6617; 3.85); 6446 (53 Nu Ser; 17.34714000; -12.8469; 4.33); 6561 (55 Xi Ser; 17.62644667; -15.3986; 3.54); 6581 (56 Omi Ser; 17.69025333; -12.8753; 4.26); 6710 (57 Zet Ser; 18.00805333; -3.6903; 4.62); 6869 (58 Eta Ser; 18.35516667; -2.8989; 3.26); 7141 (63 The1 Ser; 18.93700000; 4.2036; 4.62) |
| LUP | 5354 (Iot Lup; 14.32338667; -46.0578; 3.55); 5396 (Tau2 Lup; 14.43633333; -45.3794; 4.35); 5425 (Sig Lup; 14.54358000; -50.4569; 4.42); 5453 (Rho Lup; 14.63144667; -49.4258; 4.05); 5469 (Alp Lup; 14.69883333; -47.3883; 2.30); 5571 (Bet Lup; 14.97552667; -43.1339; 2.68); 5695 (Del Lup; 15.35619333; -40.6475; 3.22); 5776 (Gam Lup; 15.58569333; -41.1669; 2.78) |
| CRU | 4599 (The1 Cru; 12.05042000; -63.3128; 4.33); 4656 (Del Cru; 12.25242000; -58.7489; 2.80); 4730 (Alp1 Cru / Acrux; 12.44330667; -63.0992; 1.33); 4763 (Gam Cru / Gacrux; 12.51941333; -57.1133; 1.63); 4853 (Bet Cru / Mimosa; 12.79533333; -59.6886; 1.25) |

## Connectivity review and special topology

| Figure | Project-authored segments (HR) | Rationale and rejected alternative |
|---|---|---|
| HYA | 3410–3418–3454–3482–3547–3665–3748–3903–3994–4094–4232–4314–4450–4494–4552–4958–5020–5287–5526 | Open local-bend route; rejected head/body closure and long cross-body shortcut. |
| ERI | 1666–1679–1617–1560–1520–1463–1325–1298–1231–1162–1136–1084–984–917–874–850–919–883–897–794–721–674–566–472 | Open river to Achernar; rejected closure and skipped bends. |
| CET | 188–48–74–334–402–539–681–804–911 | Open sweep; rejected external Pisces/Aquarius/Taurus/Eridanus connections. |
| VUL | 7306–7405–7592–7744–7995–7891 | Restrained fox trace; rejected Cygnus/Sagitta bridge. |
| LAC | 8498–8523–8538–8585–8572–8579–8622 | Open northern zigzag; rejected Cygnus/Cepheus/Cassiopeia/Andromeda connections. |
| EQU | 8097–8123–8131–8097 | Minimal local triangle; rejected Pegasus/Delphinus bridge. |
| SCT | 6884–6930–6973–7020–7032–7063–7149 | Open shield route; rejected Aquila/Sagittarius bridge. |
| SER | Caput: 5854–5892–5868–5788–5867–5933–5879–5842. Cauda: 6446–6561–6581–6710–6869–7141. | One SER figure with exactly two disconnected components; rejected fictitious Caput–Cauda bridge or separate codes. |
| LUP | 5354–5396–5425–5453–5469–5571–5695–5776 | Compact internal route; rejected Scorpius/Centaurus connections. |
| CRU | 4763–4730; 4656–4853 | Two cross bars; rejected coordinate adjustment or horizon-based suppression. |

## Validation status

Automated catalog, source, duplicate, segment, group/query, topology, and sampling checks are present. Course-50 canonical and real-sky diagnostics expose the project-authored figures without external chart assets. Crux is retained in canonical/catalog diagnostics whether it is below the default observer horizon. Physical Quest validation remains the next task after development integration; constellation labels, Moon-alignment investigation, Milky Way/Galactic Center, eclipse, and preset work remain out of scope.
