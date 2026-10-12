# Gravity Lab

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23307832.svg)](https://doi.org/10.5281/zenodo.23307832)

**Gravity Lab: a browser-based gravity-model laboratory for foreign direct investment into Vietnam**

Phan Anh Tu ([ORCID 0000-0003-0667-3137](https://orcid.org/0000-0003-0667-3137); patu@ctu.edu.vn) and Do Thuy Huong ([ORCID 0000-0002-7711-2487](https://orcid.org/0000-0002-7711-2487); thuyhuongctu@gmail.com)
School of Economics, Can Tho University, Vietnam

Live application: **https://thuyhuongctu.github.io/Gravity-Lab/**

## Overview

Gravity Lab is an interactive teaching instrument for the gravity model in international economics and international business. It follows the model from its origin in Newtonian mechanics to its use in the empirical study of trade and foreign direct investment (FDI). The application is organised in three stages:

1. **Universal gravitation.** An N-body orbit simulator presents Newton's law, in which the attraction between two bodies is proportional to the product of their masses and inversely proportional to the square of their distance (Newton, 1687/1999).
2. **The gravity model of trade.** Mass is replaced by economic size and the distance exponent becomes a parameter to be estimated (Tinbergen, 1962). Learners explore bilateral trade between Vietnam and its partner economies on a world map, a plane or a globe.
3. **FDI into Vietnam.** The laboratory reproduces published coefficients for FDI into Vietnam (Phan & Do, 2019; Xuan & Xing, 2008). It simulates the effects of distance and market size, explains why Poisson pseudo-maximum likelihood (PPML) is preferred when flows contain zeros (Santos Silva & Tenreyro, 2006), and estimates OLS and PPML models on data uploaded by the learner.

A narrative page opens on a live 3D scene (a clay Earth with Vietnam lit, the Moon and Newton's apple on their orbits, and FDI flows arriving from the main source economies), traces the development of the model from 1665 to the present, and closes with the quality of FDI (domestic and foreign value added in exports; Pathak, 2026) and recent registered FDI (PwC Vietnam, 2025). A seven-step animation shows how Newton's equation is transformed into the trade and FDI specifications.

## Pedagogical rationale

Students of international business often meet the gravity equation as a regression specification and do not see what its terms mean or why it takes its functional form. Gravity Lab treats the equation as a single object that keeps its form across disciplines while its interpretation changes. Each stage asks the learner to change one element: the meaning of mass, the exponent on distance, the treatment of zero flows, or the dependent variable. The learner then observes the consequence directly. The intended outcome is an understanding of the specification that supports critical reading of empirical work on trade and FDI.

## Model specifications

The application presents the following sequence of equations.

Newton's law of universal gravitation, with the distance exponent fixed at two:

$$F = G\,\frac{m_1 m_2}{r^2}$$

The gravity model of trade, in which economic size replaces mass and the exponents are estimated (Tinbergen, 1962):

$$T_{ij} = G\,\frac{Y_i^{\beta_1}\,Y_j^{\beta_2}}{D_{ij}^{\gamma}}$$

The log-linear form, estimated by ordinary least squares:

$$\ln T_{ij} = \beta_0 + \beta_1 \ln Y_i + \beta_2 \ln Y_j - \gamma \ln D_{ij} + \varepsilon_{ij}$$

The structural gravity model with multilateral resistance terms (Anderson & van Wincoop, 2003):

$$T_{ij} = \frac{Y_i Y_j}{Y_W}\left(\frac{t_{ij}}{\Pi_i P_j}\right)^{1-\sigma}$$

The exponential form estimated by PPML, which retains zero flows and remains consistent under heteroskedasticity (Santos Silva & Tenreyro, 2006):

$$T_{ij} = \exp\left(\beta_0 + \beta_1 \ln Y_i + \beta_2 \ln Y_j - \gamma \ln D_{ij}\right)\eta_{ij}$$

The FDI specification for Vietnam, with institutional, cultural and economic distance in $X_{it}$ and a source-country random effect $u_i$ (Phan & Do, 2019):

$$\ln \mathit{FDI}_{it} = \beta_0 + \beta_1 \ln Y_{it} + \beta_2 \ln Y_{VN,t} - \gamma \ln D_{i,VN} + \delta' X_{it} + u_i + \varepsilon_{it}$$

Two WTO and UNCTAD guides frame the estimation practice taught in the application: Bacchetta et al. (2012) on the "gold, silver and bronze medal" mistakes and on fixed effects for multilateral resistance, and Yotov et al. (2016) on structural gravity with panel data, intra-national trade, exporter-time, importer-time and pair fixed effects, and PPML. The Story page reproduces their resolution of the "distance puzzle" (Table 2). Majumdar and Basu (2023) augment the equation with an exchange-rate uncertainty index and the real exchange rate for India's trade with its top five partners and the SAARC countries; the Story page uses the study to show why time-invariant distance cannot be identified under country-pair fixed effects. The meta-analysis of Disdier and Head (2008) is used as a benchmark for the distance elasticity in trade, with a mean near 0.9. In Phan and Do (2019), the coefficient on geographic distance for FDI into Vietnam is approximately −0.38 from Model 4 onwards.

## Features

- **Bilingual interface** in Vietnamese and English. Use the VI/EN switch or open the application with `?lang=en`.
- **Light and dark themes.** The default follows the device setting, and the choice is remembered on the device.
- **Theme song and sonification.** A theme song in Vietnamese and English, with lyrics, can be played from the sound panel. The orbit simulator can be heard: each body is assigned a pitch proportional to its angular speed, so inner orbits sound higher, as Kepler's third law implies. A separate panel transposes the sidereal orbital periods of the planets by whole octaves into the audible range (Kepler, 1619/1997; Williams, n.d.). The ambience and tones are synthesised in the browser, the song is streamed only on request, and all sound is off until the user enables it.
- **Installable progressive web application** with its own icon. There is no sign-in, no database and no call to an external service.
- **Citation support.** The concept DOI is shown in the header, and an APA 7 reference list is available in every room.

## Data and visual sources

- **Country outlines** come from Natural Earth (`ne_10m_admin_0_countries`, public domain), simplified by `scripts/build-land.py` into `src/data/land.ts`.
- **Map of Vietnam.** The coastline uses the Natural Earth 1:50m outline (`scripts/vn-map/vnm.json`). The Hoàng Sa (Paracel) and Trường Sa (Spratly) archipelagos are placed from the coordinates of their principal features. The map appears in two forms: a faint background layer (`scripts/vn-map/build.py`) and a clay rendering.
- **Clay illustrations.** The map of Vietnam, the Newton scene, the room covers and the application icon are rendered with three.js in a "clay noir" style: a single warm spotlight, a cool rim light, vignette and film grain. The scenes and instructions for re-rendering them are in `scripts/clay-noir/`.
- **Historical figures.** The clay figure of Isaac Newton follows Godfrey Kneller's 1689 portrait, which is in the public domain. The figure of Jan Tinbergen is a stylised tribute and is not based on any single photograph. Both figures, and the illustration of the two at a blackboard, were created for this application. The chalk in that illustration shows a simplified form of the equations; the application states the full specifications in text.
- **Characters.** The class characters come from the BizOn clay library and belong to the authors (see [`LICENSE`](LICENSE)). Their spacesuit figures, portraits and classroom scenes (`public/cast/suit`, `public/cast/astro`, `public/scene`) were generated by the authors with an AI image tool from the original characters.
- **Sound.** The ambience, orbit sonification and planetary tones are generated at run time with the Web Audio API by code written for this application (`src/lib/sound.ts`); they use no samples or third-party compositions. The musical elements used (an open fifth, a pentatonic scale, octave transposition) are common knowledge. The planetary tones are computed from published orbital periods, which are facts and are cited.
- **Theme song.** The song exists in two versions: *Từ một quả táo rơi* (Vietnamese, 5:13) and *Gravity Lab — From an Apple to the Stars* (English, 5:53). Both retell the path from Newton to Tinbergen, PPML and FDI into the Mekong Delta. The lyrics were written by the authors; the music was generated by the authors with an AI music tool from those lyrics and a style description. The recordings (`public/music/`) are streamed only when the listener presses play, and the lyrics of both versions are shown in the sound panel (`src/lib/song.ts`).
- **Typefaces.** Plus Jakarta Sans and Be Vietnam Pro are self-hosted under the SIL Open Font License 1.1 (`src/fonts/OFL.txt`).
- **Physical constants.** CODATA 2022 values are used (Mohr et al., 2025). Planetary periods are taken from the NASA Planetary Fact Sheet (Williams, n.d.).

## Running and building

The application is a static single-page application built with React, Vite and Tailwind CSS. It requires Node.js 22 or later.

```sh
npm install
npm run dev        # development server at http://localhost:8080
npm run build      # static build in dist/
npm run typecheck  # TypeScript
npm run lint       # ESLint
npm test           # unit tests: globe and world-map geometry, FDI model, sound mappings
```

The build uses relative paths and can be served from any static host. The repository deploys automatically to GitHub Pages on each change to `main` (`.github/workflows/pages.yml`).

## Provenance

This repository is a standalone edition of Gravity Lab, separated from the [BizOn](https://github.com/thuyhuongctu/BizOn) teaching ecosystem for academic archiving and an independent DOI. An earlier static HTML version remains available at https://thuyhuongctu.github.io/BizOn/lab/gravity-lab.html and in the git history (commit `1857067`).

## How to cite

Please cite the version you used. The concept DOI covers all versions and always resolves to the latest release: **[10.5281/zenodo.23307832](https://doi.org/10.5281/zenodo.23307832)**.

> Phan, A. T., & Do, T. H. (2026). *Gravity Lab: A browser-based gravity-model laboratory for FDI into Vietnam* (Version v2.3) [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.23313162

| Version | DOI |
| --- | --- |
| v2.3 | [10.5281/zenodo.23313162](https://doi.org/10.5281/zenodo.23313162) |
| v2.2 | [10.5281/zenodo.23308587](https://doi.org/10.5281/zenodo.23308587) |
| v2.1 | [10.5281/zenodo.23308307](https://doi.org/10.5281/zenodo.23308307) |
| v2.0 | [10.5281/zenodo.23308130](https://doi.org/10.5281/zenodo.23308130) |
| v1.0 | [10.5281/zenodo.23307833](https://doi.org/10.5281/zenodo.23307833) |

Complete metadata are provided in [`CITATION.cff`](CITATION.cff). From v2.3 the deposited files on Zenodo are openly downloadable for reading, consultation and citation; earlier versions were deposited with restricted access. Open access to the files does not change the licence: the software remains proprietary (see [`LICENSE`](LICENSE)).

## References

Anderson, J. E., & van Wincoop, E. (2003). Gravity with gravitas: A solution to the border puzzle. *American Economic Review, 93*(1), 170–192. https://doi.org/10.1257/000282803321455214

Bacchetta, M., Beverelli, C., Cadot, O., Fugazza, M., Grether, J.-M., Helble, M., Nicita, A., & Piermartini, R. (2012). *A practical guide to trade policy analysis*. World Trade Organization; United Nations Conference on Trade and Development. https://www.wto.org/english/res_e/publications_e/wto_unctad12_e.htm

Disdier, A.-C., & Head, K. (2008). The puzzling persistence of the distance effect on bilateral trade. *The Review of Economics and Statistics, 90*(1), 37–48. https://doi.org/10.1162/rest.90.1.37

Kepler, J. (1997). *The harmony of the world* (E. J. Aiton, A. M. Duncan, & J. V. Field, Trans.). American Philosophical Society. (Original work published 1619)

Majumdar, D., & Basu, S. (2023). Exchange rate uncertainty and India's bilateral trade: A gravity model approach. *Arthaniti: Journal of Economic Theory and Practice*. Advance online publication. https://doi.org/10.1177/09767479231178953

Mohr, P. J., Newell, D. B., Taylor, B. N., & Tiesinga, E. (2025). CODATA recommended values of the fundamental physical constants: 2022. *Reviews of Modern Physics, 97*, Article 025002. https://doi.org/10.1103/RevModPhys.97.025002

Newton, I. (1999). *The Principia: Mathematical principles of natural philosophy* (I. B. Cohen & A. Whitman, Trans.). University of California Press. (Original work published 1687)

Pathak, A. (2026, June 30). *Is FDI enough? The quality versus quantity debate*. Hinrich Foundation. https://www.hinrichfoundation.com/research/fdi

Phan, A. T., & Do, T. H. (2019). Tác động của khoảng cách, quy mô thị trường và dòng vốn FDI vào Việt Nam giai đoạn 2006–2015: Ứng dụng mô hình lực hấp dẫn [The impact of distance and market size on FDI into Vietnam, 2006–2015: Applying the gravity model]. *Tạp chí Kinh tế Đối ngoại*, (114), 14–26.

PwC Vietnam. (2025). *Vietnam economic update 9M 2025*. PwC (Vietnam) Company Limited. https://www.pwc.com/vn

Santos Silva, J. M. C., & Tenreyro, S. (2006). The log of gravity. *The Review of Economics and Statistics, 88*(4), 641–658. https://doi.org/10.1162/rest.88.4.641

Tinbergen, J. (1962). *Shaping the world economy: Suggestions for an international economic policy*. Twentieth Century Fund.

Williams, D. R. (n.d.). *Planetary fact sheet – Metric*. NASA Goddard Space Flight Center. Retrieved October 12, 2026, from https://nssdc.gsfc.nasa.gov/planetary/factsheet/

Xuan, N. T., & Xing, Y. (2008). Foreign direct investment and exports: The experiences of Vietnam. *Economics of Transition, 16*(2), 183–197. https://doi.org/10.1111/j.1468-0351.2008.00321.x

Yotov, Y. V., Piermartini, R., Monteiro, J.-A., & Larch, M. (2016). *An advanced guide to trade policy analysis: The structural gravity model*. World Trade Organization; United Nations Conference on Trade and Development. https://www.wto.org/english/res_e/booksp_e/advancedwtounctad2016_e.pdf

## Licence

This is proprietary software, published openly for academic transparency and citation. See [`LICENSE`](LICENSE). Third-party components retain their own licences: Natural Earth data are in the public domain, three.js is distributed under the MIT License, and the typefaces are distributed under the SIL Open Font License 1.1.

---

© 2026 Assoc. Prof. Dr. Phan Anh Tu and Do Thuy Huong (PhD candidate), School of Economics, Can Tho University.
