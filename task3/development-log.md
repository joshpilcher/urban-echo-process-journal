# Task 3 — Development Log

## 19 October 2026 — Moving from concept to working prototype

Task 2 explored Urban Echo as a location-aware experience where the physical location forms part of the interface. Two concepts were considered: Landmark Stories and user-created Echoes. The second was chosen because it gives ordinary places personal meaning through memories contributed by visitors.

For Task 3, the priority is to demonstrate an actual interaction between device location and the content presented to the user, rather than producing static interface screens.

### Prototype scope and development decisions

The first prototype uses a responsive mobile-first layout with an interactive Leaflet/OpenStreetMap map, a device geolocation watcher, proximity-gated memories, and a form to leave an Echo at the user's current GPS coordinates. A 100-metre radius is an initial design assumption to be tested on a mobile device, not a proven optimal distance.

To keep the first iteration achievable, Echoes are currently stored in the browser's localStorage rather than a remote database. This proves the core interaction but means memories will not be shared between users or devices. The location and content are saved only in the current browser. The prototype initially has no seeded memories; users can create their own while physically present. The lack of a multi-user backend is a known limitation, not a completed feature.

The application checks whether GPS accuracy is within 100 metres before enabling creation. Echo stories are locked when the user is farther than 100 metres away, while titles and marker locations remain visible to guide discovery. These checks are client-side demonstrations and do not prevent spoofed positions or tampering.

The UI uses a dark palette with mint green for locations and unlocked interactions. On smaller screens, the map and Echo panel stack vertically.

### Technical approach

- Live map: Leaflet with OpenStreetMap tiles
- Sensor input: browser Geolocation API using watchPosition
- Spatial interaction: great-circle distance calculation for proximity
- State and persistence: JavaScript and browser localStorage
- Responsive layout: CSS grid and mobile media queries
- Graceful handling: GPS permission, timeout, low accuracy, and storage errors

### Testing and reflection — to be completed after real-device testing

The implementation has been committed to GitHub, but GPS tracking, permission handling, location accuracy, proximity unlocking, and mobile layout must still be verified on a physical phone. Screenshots, bugs found, corrections, and results will be recorded here only after tests have been carried out.

### Next iteration

1. Run the app through HTTPS on a real phone and capture evidence of the GPS state.
2. Test creating an Echo at the current location and viewing it nearby.
3. Move outside the interaction radius and test the locked state.
4. Address problems discovered, then evaluate a shared backend, privacy controls, and photo upload.
5. Record the working interactions for the final showreel.

**Development files:** [Urban Echo application repository](https://github.com/joshpilcher/urban-echo) · [Task 2 process journal](../index.html)

---

## 19 October 2026 — Iteration 02: making location response reliable

**AI-assisted development record.** This entry records implementation and automated browser observations made with Codex assistance. It does not describe a physical walking test or claim user feedback that has not happened. The original Task 2 concept/research sections remain unchanged.

### What the review found

The initial app already implemented the main concept, but the GPS watcher was represented by a boolean rather than its actual subscription ID. Retrying after failure could create additional watchers. A saved position also had no expiry, and discovery used distance alone even when the GPS reading was imprecise. These gaps could leave a story open, or attach a new memory to an old fix.

An actual Chromium click test exposed a separate interface bug: the original Leaflet CSS integrity hash was wrong. The browser rejected that stylesheet, leaving map tiles positioned over other controls. The test could not tap Enable GPS because a tile intercepted the pointer. The corrected hash matches the official Leaflet 1.9.4 CSS. Leaflet's JS/CSS and licence are now bundled in the app, while map tiles still come from OpenStreetMap.

A later browser geolocation-provider test exposed a transient-error case: changing the overridden device position briefly produced a location-unavailable callback before the next valid reading. Cancelling every failed watcher prevented recovery. The revised implementation cancels on permission denial, explicit stop, retry and page exit; temporary unavailability/timeouts invalidate the fix but keep the existing subscription available for the next reading.

### Design decisions and implemented changes

- **Make uncertainty visible.** The app retains the provisional 100 m discovery radius. A story opens when `distance + reported accuracy <= 100 m`. For example, 95 m away with ±15 m accuracy shows “checking GPS” rather than revealing the story. This is a cautious interaction rule based on an estimate, not a guarantee of physical presence.
- **Require a recent position.** A fix becomes unusable after 30 s. Stories relock and creation is disabled until a new reading arrives. A Refresh GPS action restarts the watcher if needed. This duration is a starting assumption; stationary-phone behaviour needs evaluation before keeping it for the final prototype.
- **Make tracking controllable.** Stop tracking clears the user marker and accuracy circle, relocks stories and cancels the watcher. Callbacks queued from previous subscriptions are ignored.
- **Save where the user is, not where the map points.** The form shows the latest coordinates and accuracy. Saving rechecks GPS and uses the position at submission, including if the user has moved while typing. Drafts survive GPS or storage errors while the page stays open; they are not saved across reloads.
- **Keep local memories compatible.** The original storage key is retained. Record fields and coordinate ranges are validated; corrupt records block writing instead of being silently overwritten. Saving rereads storage, and other-tab changes update the list. This reduces ordinary tab conflicts but does not make localStorage a transactional shared database.
- **Clarify discovery.** All Echoes and Within reach filters, distance sorting, a reachable count, distinct locked/checking/unlocked states and matching map markers make location response legible. No fictional memories are shipped to the normal app.
- **Improve small-screen use.** Controls have larger touch targets, form fields use 16 px text, dialog overflow is supported, keyboard focus is visible and retained across GPS list updates, and JavaScript map animation respects reduced-motion preferences.
- **Render contributions as text.** Leaflet interprets string tooltip content as HTML. Titles now enter tooltips as text-only DOM elements, matching the cards. A browser test confirmed an HTML-like title was not executed.
- **Keep the main loop available without map assets.** A missing map script or failed tile requests show a notice while GPS, the list and memory creation continue to work.

### Verification performed

**Result: 5 Node tests and 16 browser checks passed.** The [Node output](test-results-core.txt) and [browser output](test-results-browser.txt) are retained with this iteration.

Node tests exercise the distance calculation, exact/uncertain proximity states, freshness and accuracy rules, invalid coordinates/dates and valid v0.1 record compatibility. Browser integration tests exercise real DOM interactions with controlled GPS callbacks, plus Chromium's overridden geolocation provider. The test runner is committed so these checks can be repeated.

The browser checks cover permission denial and retry without duplicate subscriptions; recovery after a temporary error; creation at the GPS coordinates and persistence after reload; movement-driven locking and unlocking; low accuracy; failed-save draft retention; stopping and ignoring old callbacks; text-only tooltips; full storage; corrupt storage preservation; 30 s expiry; layouts and dialog bounds at 320, 390, 768 and 1440 px; uncaught JavaScript errors; the browser geolocation-provider integration; and the missing-map-script fallback.

**Environment:** Playwright 1.62.1 with headless Chromium 133 on Linux. The standard Playwright browser download was unavailable in the work environment, so a separate Chromium binary was used for the run. This is not an iOS Safari or Android Chrome test. GPS coordinates and memories in the evidence are synthetic test fixtures. Optional Google Fonts requests were disabled in the final runner so captures use the app’s normal system-font fallback. Chromium 133 still stalled on Playwright’s font-ready wait in a rerun, so capture was run with `PW_TEST_SCREENSHOT_NO_FONTS_READY=1`; this bypasses a screenshot wait, not a functional assertion. Basemap tile availability is a separate network dependency. Early browser runs without the environment’s network proxy showed failed tile loading while the list workflow continued to function. The final screenshot run used the proxy and loaded the OpenStreetMap basemap successfully.

### Captured browser evidence

These are screenshots of the implemented application, not design mock-ups. The banners identify simulated GPS and test content. They demonstrate interface states and error handling; they do not demonstrate a person physically visiting these places.

![Mobile discovery interface with synthetic nearby and distant memories](screenshots/iteration-02-mobile.png)

*390 px browser viewport: location status, uncertainty-aware discovery, local-only storage notice, and an unlocked and locked memory.*

![Create Echo form with current simulated GPS coordinates](screenshots/iteration-02-create.png)

*Mobile form: precise save location and privacy explanation, bounded title/story fields, and a draft waiting to be saved.*

![Desktop discovery with checking-GPS and locked stories](screenshots/iteration-02-desktop.png)

*1440 px browser viewport: the list and map adapt to the wider layout. A nearby memory remains closed when the accuracy estimate crosses the interaction boundary.*

### Development reflection and limits

The browser work showed why visible polish is not enough: the original code appeared to cover GPS, but a rejected stylesheet could make its controls unusable, and a transient location failure could stop later updates. Testing actual taps and browser callbacks exposed these issues.

The new checking state is more honest about GPS uncertainty, but may also frustrate someone who is already standing near a place. A field trial should record when it appears, how long it lasts and whether users understand how to proceed. Similarly, the 30 s expiry avoids stale access but could interrupt reading on a stationary device that does not emit regular updates. Neither setting has been validated outdoors.

This remains a single-browser prototype. Location gating is client-side and the local stories can be inspected in developer tools; it is not a security boundary. There is no shared storage, account system, photo upload, moderation or user-facing memory deletion yet. User testing, accessibility testing with assistive technology, physical-device GPS measurements and the final showreel remain outstanding.

### Next evidence and assessment milestones

1. Follow the [phone test checklist](https://github.com/joshpilcher/urban-echo#physical-phone-test-still-needed) on an HTTPS deployment. Record real device/browser, conditions, accuracy, lock/unlock distances and observed failures; add genuine screenshots and personal reflections.
2. Review the discovery radius and fix-expiry policy against those results.
3. Add shared storage with clear ownership, public/private scope and deletion behaviour. Then add validated photo uploads and error feedback; do not imply that existing local memories are already shared.
4. Record the final **1–3 minute standalone showreel**: explain the audience/place context, show enabling location, approach and reveal a memory, create a new memory, and show the prototype responding as the user moves away. Use actual device footage for claims about real-world response.
5. Finish the journal with a critique of the final outcome, supported by results. This supports Task 3's responsive technology, conceptual foundation, fabrication/finish and documentation criteria without presenting unfinished features as completed work.

### Technical references consulted

- [MDN — watchPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition): watcher lifecycle, permission and secure-context requirements.
- [MDN — clearWatch](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/clearWatch): cancelling location subscriptions.
- [Leaflet reference](https://leafletjs.com/reference.html): tooltip HTML/DOM content behaviour and map controls.


---

## 19 October 2026 — Separating the application and assessment journal

At Joshua’s request, the application moved to its own public repository, [joshpilcher/urban-echo](https://github.com/joshpilcher/urban-echo), matching the source repository’s visibility. The application HTML, CSS, JavaScript, Leaflet distribution, tests and package configuration now live at that repository’s root. This journal retains the completed Task 2 sections, Task 3 development notes, original source history and captured evidence.

The standalone application is based on the tested snapshot `fd3aacf307e0452104cd9d11b2b580f1ab7ef25e`. Its migration note links back to that source history. The new repository begins with an import commit; it does not claim to reproduce the original commit graph. Relative test paths, test-server URL and journal link were adjusted for the root layout. Generated app-test screenshots are ignored in `test-results/screenshots/` so repeated test runs do not replace assessment evidence automatically.

**Verification after separation:** five Node location-rule tests and 16 browser checks passed against the standalone root layout. For this relocation check, external HTTPS requests were deliberately blocked with `ECHO_TEST_OFFLINE=1`; this validates the local GPS/list workflow and map-failure handling, not live basemap delivery. [Node output](migration-test-results-core.txt) · [browser output](migration-test-results-browser.txt). The uploaded application tree was checked against the tested local tree and matched exactly.

The journal cleanup keeps a small `/app/` landing page pointing to the new repository, so the former entry point explains where the source moved. This change does not create a new live deployment or migrate browser-local memories to another origin. The existing journal draft PR contains this cleanup; the journal’s main branch changes only when that PR is merged. The completed Task 2 HTML remains unchanged.

![New standalone Urban Echo repository containing the app files and tests](screenshots/repository-separation.jpg)

*GitHub repository after uploading the standalone application. This is repository-organisation evidence, not a new GPS field test.*

**Design reflection:** separating the source code from the assessment narrative makes the app easier to run and deploy independently, while keeping the process journal focused on decisions, outcomes and critique. Future app changes should be made in the new repository, with significant progress and genuine evidence recorded here.


---

## 19 October 2026 — Merge and HTTPS deployment

Joshua authorised merging the journal PR and publishing the standalone app. [PR #1](https://github.com/joshpilcher/urban-echo-process-journal/pull/1) was merged as `0e983854e9290c18e59d9b0a89ca2916f2090016`. The completed Task 2 sections were retained.

The application is now live at **[https://joshpilcher.github.io/urban-echo/](https://joshpilcher.github.io/urban-echo/)**. GitHub Pages is configured to deploy the application repository’s `main` branch at `/ (root)`, with HTTPS enforced on the default GitHub Pages domain. The initial [Pages build and deployment](https://github.com/joshpilcher/urban-echo/actions/runs/39202582914) published application commit `412b9a8bab0fa40dabd2c44953d16b89e7b4ac2e`.

**Live verification:** the published page opened over HTTPS in the browser and displayed the map, loaded OpenStreetMap tiles, location controls, discovery filters, local-storage notice and initial empty state. No location permission was granted and no real-world GPS walk was performed during this deployment check. The screenshot below is the actual published initial screen, without simulated coordinates or invented memories. Its map is the app’s default region, not a captured user location.

![Live Urban Echo initial screen published over HTTPS](screenshots/live-deployment.jpg)

*Published desktop interface before enabling GPS. This establishes successful delivery and initial rendering, not phone GPS accuracy or proximity behaviour.*

The live app and journal now link to one another, and the former journal `/app/` entry point links to the deployed app. The application README also provides the live URL. Subsequent pushes to each repository’s configured main branch trigger their respective Pages rebuilds.

**Reflection and next test:** publishing the prototype makes it possible to test the device-location interaction on a phone over HTTPS. The next evidence should be a genuine create → move away → relock → return → unlock sequence, including the observed accuracy and any interruptions caused by the provisional 30-second freshness policy. Shared storage and photo uploads are still unimplemented; the deployed app remains browser-local.


## 19 October 2026 — First response to the live prototype

Joshua reported that the deployed app “works” but needs further polishing and more features. This is initial user feedback, not a measured outdoor GPS/proximity test; no device, accuracy readings, walk distances or screenshots were supplied with that feedback. A review of the current implementation identified the long stacked mobile layout, lack of a dedicated Echo detail view, and missing edit/delete actions as candidates for the next iteration. Feature and visual priorities are being clarified before implementation; shared storage and photo uploads remain planned rather than completed.


---

## 19 October 2026 — Iteration 03: photo memories and a closer visual match

Joshua selected **attach photos to memories**, **discover other people’s Echoes**, and **match the Task 2 mock-up more closely** as the next priorities. Development therefore moved from the initial stacked layout toward the Task 2 white/lavender surface, serif masthead, teal controls, map pins, rounded discovery sheet and photo-led detail view. The original mock-up remains unchanged in the completed Task 2 section.

### Implemented in this increment

- An expandable mobile map sheet and wider desktop sidebar, with working Map, Nearby and My Echoes views. Search filters titles; Photos and Stories filter real saved records. Controls that would imply unimplemented likes, audio or profiles were omitted.
- A dedicated memory detail view. It reacts to the same GPS state as the list: moving outside the discovery boundary hides the open story and photo again.
- A revised Create Echo screen with character counts, current GPS mini-map and an explicit visibility choice. The pin uses the GPS coordinates at submission, even if the map was panned. Draft text survives preparation, GPS and storage errors.
- Local photo attachment: JPEG, PNG and WebP files up to 10 MB are decoded, resized to a maximum dimension of 1600 px and re-encoded as JPEG below 1500 KB. Re-encoding discards the original metadata. Photos use IndexedDB rather than expanding localStorage records; the original text-memory format stays compatible.
- A two-step delete action removes device memories and their stored photo. Device-only remains the default; no existing memory is automatically uploaded.

### Shared discovery: prepared, not yet operational

The app now contains a Supabase adapter, the official vendored JavaScript SDK, a proposed database/storage migration and explicit Public consent text. The migration defines public reading and creator-only writes/deletion, with photo paths scoped to an authenticated anonymous contributor. Public sharing would reveal the title, story, exact pin and photo. The 100 m rule is an interface interaction, not protection for confidential content.

**Connection status:** Joshua installed the Supabase plugin. Its project tools were not exposed to the development session, so no project was selected, migration applied, live upload made or real multi-user discovery test completed. Project configuration remains empty and Public is visibly disabled. This is a tooling blocker, not evidence that the cloud feature works. The next step is to connect a dedicated project, enable anonymous sign-ins and verify RLS with independent users before enabling Public.

Anonymous ownership is a limited prototype decision: it avoids an account form, but clearing site data loses control of previously shared contributions. The first query is capped at the newest 200 public Echoes. Account recovery, moderation, geographic pagination and robust orphan-media cleanup remain future work.

### Testing and genuine evidence

**13 Node checks passed:** the five existing location-rule checks plus eight adapter contract checks using a fake SDK. The latter cover public reads without sign-up, owner-scoped photo upload, upload failure, uncertain insert reconciliation, failed-insert cleanup and deletion restrictions. A failed insert now checks whether its row committed before removing the photo; this avoids deleting an image after a success response is lost. These checks do **not** establish that real Supabase policies are deployed or correct.

**18 browser checks passed** in Chromium 133 with Playwright 1.62.1. The previous 16 GPS/storage/layout checks still pass, alongside photo type/decode errors, preservation of draft text, 2000 × 1000 → 1600 × 800 JPEG conversion, IndexedDB persistence after reload, hiding the photo without GPS, relocking an open detail view and deleting the blob. Responsive bounds were checked at 320, 390, 768 and 1440 px. External HTTPS requests were blocked for this run; cached tiles can appear in captures and are not evidence of live basemap delivery. This remains simulated GPS, not a measured outdoor walk.

[Node check output](iteration-03-test-results-node.txt) · [Browser check output](iteration-03-test-results-browser.txt)

![Iteration 03 mobile map and discovery sheet](screenshots/iteration-03-mobile.png)

*Implemented interface, 390 px, with simulated GPS and written test memories.*

![Photo memory detail with a synthetic test image](screenshots/iteration-03-photo-detail.png)

*The teal image was generated by the browser test as a validation fixture. It is not a photograph of a visited place. The screenshot shows the implemented photo detail view, with an explicit test label.*

![Photo selected in the creation form](screenshots/iteration-03-photo-create.png)

*Actual browser-rendered form and photo preview. The story and image identify themselves as synthetic test content.*

### Design reflection and remaining evaluation

The map sheet makes place feel central again and reduces the long mobile page, while the serif headings and teal palette reconnect the working prototype with the original visual direction. The detail screen gives a memory space to be read rather than fitting everything into a card. On small screens the compact sheet shows only part of a card; Nearby expands the list, but this interaction needs testing with people to see whether they notice it.

Client-side photo preparation reduces storage/upload size and avoids retaining original EXIF metadata, at the cost of rejecting HEIC and flattening image transparency. The browser fallback and camera/library selection still need iOS Safari and Android Chrome testing, including orientation, large photographs, keyboard overlap and device storage pressure. Automated browser results cannot establish those outcomes.

The next technical milestone is a verified two-session public photo contribution and discovery, with attempted cross-user writes/deletes rejected by the real service. The next assessment evidence remains a genuine phone create → move away → relock → return → unlock test and the standalone 1–3 minute showreel. No participant feedback, outdoor results or final personal reflection has been invented for this entry.


## 19 October 2026 — Supabase project and database provisioned

The Supabase tools became available after the previous entry. Joshua chose the student organisation for a separate Urban Echo project. The connector created `jamgivrngcderqmemjmb` in Sydney (`ap-southeast-2`); the existing inactive BikePark project was not modified.

Applied `urban_echo_public_memories` and `urban_echo_least_privilege_grants`. The second migration followed an inspection that found inherited INSERT, DELETE, TRUNCATE and other broad grants. It revokes all client-role table privileges, then grants only SELECT to public readers and SELECT/INSERT/DELETE to authenticated contributors. The row policies still restrict creation/deletion to the contributor ID. Verification confirmed RLS enabled, all six intended table/storage policies and the public JPEG bucket with its 1,572,864-byte limit. A real request to the table REST endpoint using the publishable key returned HTTP 200 and `[]`.

Supabase security advisors returned no findings after the change. The performance advisor reported two unused indexes on the new, empty table; they were retained for date ordering and ownership lookups. [Advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index). An advisor result is not proof that the full multi-user workflow works.

The public Auth settings endpoint confirms `anonymous_users: false`. The connector has no Auth-settings operation, so the approved browser fallback was used. Dashboard sign-in reached a CAPTCHA requiring Joshua’s manual completion. No challenge was bypassed. Anonymous sign-ins have not been enabled, no test photo has been uploaded, and no two-user/RLS write test has been completed. The client configuration remains empty and Public remains disabled while this is unresolved. The next action is to finish dashboard sign-in, enable the anonymous contributor flow, and run the actual sharing/ownership tests before deployment.

Current Supabase changelog and documentation were reviewed, including explicit Data API grants and public-bucket access. This is backend provisioning evidence; the existing browser screenshots still represent simulated location and synthetic image tests.


## 19 October 2026 — Iteration 04: real shared photo discovery

Joshua completed the Supabase dashboard sign-in. Anonymous sign-ins were enabled for the dedicated Urban Echo project, and the browser client was connected using only the project URL and publishable key. Contributors are authenticated as anonymous users; reading public Echoes does not create an account. The default create option is still Only this device. Choosing Public explicitly shares the story, photo and exact pin; old device memories are not uploaded automatically.

### Verified against the real backend

**Seven live shared-storage browser checks passed**, using two isolated browser contexts and the actual Supabase Auth, database and Storage APIs. Location callbacks and the image were synthetic; the backend requests were real.

1. Both sessions read public Echoes without creating contributor accounts.
2. A deliberately interrupted row insertion left the photo draft and text intact. The app reconciled the row and removed the failed attempt’s uploaded object; retry succeeded.
3. Session A created an anonymous contributor and shared a JPEG photo and Echo through the actual form. No local memory record was created for this public post.
4. Session B refreshed and discovered A’s Echo. Its story/photo stayed closed without GPS, opened at the simulated location and relocked when the location moved away. The remote photo loaded, and B had no Delete control for A’s Echo.
5. Direct client API attempts confirmed backend enforcement rather than relying on a hidden button: unauthenticated insertion, an authenticated insertion with A’s owner ID, cross-user updates, uploading into A’s photo folder, deleting A’s row and removing A’s photo were rejected or affected zero records. A’s row/photo remained intact.
6. A reloaded, retained its anonymous creator session and deleted its Echo and photo. B’s refresh removed the contribution. A separate SQL check confirmed **zero Echo rows and zero objects in the photo bucket** afterwards. Two anonymous test Auth accounts remain; these are test sessions, not participants.
7. No uncaught application errors occurred during the shared workflow.

[Live shared-service output](shared-test-results.txt) · [Device-only regression output](connected-regression-results.txt) · [Node output](connected-node-results.txt)

The original **18 device-only browser checks** and **13 Node checks** also pass with the connected build. The regression runner explicitly injects empty cloud configuration so ordinary local tests never publish their synthetic memories; `npm run test:shared` is a separate, deliberate live-service run. The latter creates a uniquely labelled test Echo and removes it and its photo on completion.

![Second browser session reading a real shared photo Echo](screenshots/shared-discovery.png)

*Actual implemented screen in session B, reading session A’s real Supabase contribution. The banner distinguishes live shared storage from simulated GPS and the synthetic image. This is not evidence of two people meeting outdoors or a physical phone walk.*

### Security review and prototype limits

The final security-advisor run now flags Anonymous Access Policies on the Echo and storage policies because anonymous contributors are intentionally supported. The live tests confirmed those operations remain scoped to the creator. The advisor also flags leaked-password protection disabled on the default email provider, which remains enabled in Supabase defaults although the application offers no email/password flow. These are recorded, not presented as a clean production audit. [Anonymous policy advisory](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins) · [Password protection guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Default anonymous sign-up rate limits remain in place; no CAPTCHA, moderation interface or account recovery has been added. Clearing site data loses an anonymous contributor’s ability to manage existing public posts. The prototype reads the newest 200 public Echoes and is not yet a scalable geographic feed. Public bucket URLs and API data remain public regardless of the interface’s 100 m reveal rule. These limits should be addressed before broader public use.

### Reflection and next evidence

Real sharing changes Urban Echo from a personal location journal toward the social concept in Task 2: a place can carry a memory left by someone else. Testing with independent sessions was necessary because local persistence alone could make the interface look shared without actually proving it. The direct ownership tests likewise showed that deletion restrictions are enforced by the backend, not just the interface.

The next evaluation should involve an actual phone photo, a public contribution and another device approaching it outdoors, recording GPS accuracy and lock/unlock behaviour. iOS/Android image orientation, camera selection, keyboard behaviour and storage pressure still need observation. The provisional 100 m discovery radius and 30 s freshness window remain unvalidated outdoors. The final 1–3 minute standalone showreel and Joshua’s personal evaluation remain outstanding; no field results or participant feedback have been invented.


### Publishing the connected prototype

[Application PR #1](https://github.com/joshpilcher/urban-echo/pull/1) was marked ready and merged as `23ea1b13e37808a400ea0eff88cf3a67c38da19a`. The [GitHub Pages deployment](https://github.com/joshpilcher/urban-echo/actions/runs/39206899280) completed successfully. The published [Urban Echo app](https://joshpilcher.github.io/urban-echo/) was opened over HTTPS and rendered the version 0.3 redesign, loaded basemap, enabled shared Refresh control and **0 community Echoes** after the live test cleanup. No GPS permission was requested or granted in this published-page check; it verifies delivery and the initial shared read, not field behaviour.

![Published version 0.3 connected to shared storage](screenshots/shared-live-deployment.jpg)

*Actual published initial screen after cleanup, with no simulated memories or real location granted. The Sunshine Coast map is the app’s default view.*

The completed Task 2 HTML was checked byte-for-byte against the original again and remains unchanged. This entry adds genuine Task 3 progress and preserves the earlier pending-state entries as a development record.


## 21 October 2026 — Iteration 05: cleaning up the phone interface

Joshua reported that the UI was not working well on mobile and asked for a cleanup. Reviewing the implemented layout showed a concrete problem: the map sheet compressed filters, status copy, privacy text, memory cards and creation into a limited-height overlay. Supporting text fell to 7–10 px, and the usable card area was too small. The original drag-handle-style button did not clearly communicate that it opened a larger list. This is user feedback and implementation review, not a new participant study.

### Design changes implemented

- **Map is a preview; Nearby is a reading/browsing screen.** The mobile map shows one complete memory preview and a visible View list control. Nearby and My Echoes fill the content area with readable, scrolling cards. Map or Show map returns to the map, and the navigation state now matches the displayed view.
- **A clearer hierarchy.** Filters and explanatory text appear in the full list rather than competing with the compact preview. The serif headings and teal visual direction from Task 2 remain, with larger card/body text and controls at least 44 px high. The duplicate mobile Add item is removed; the visible Create Echo button remains the main creation action.
- **Responsive space.** Small portrait screens use a shorter preview; short landscape screens put the map and preview side by side. The community status has its own readable line beneath the media filters. Hidden accessibility elements were positioned so they no longer add unwanted document overflow.
- **Create and detail.** The creation dialog follows the dynamic viewport and keeps its close/header available while scrolling. The detail close control has a persistent toolbar for long stories, and mobile photos use contain sizing so the complete image is visible. Real phone keyboard/safe-area behaviour still needs physical-device evaluation.

### Before and after

![Mobile interface before cleanup](screenshots/iteration-05-before.png)

*Fresh browser capture of version 0.3 before the cleanup. Simulated GPS and synthetic memories; this is not an outdoor photograph or user test.*

![Cleaned-up mobile Map preview](screenshots/iteration-05-mobile.png)

*390 × 844 browser viewport after the change. The test banner is outside the app area so it does not obscure the masthead. One complete card, a visible View list action and one primary Create Echo action replace the crowded compact sheet.*

![Full-height Nearby list](screenshots/iteration-05-nearby.png)

*The same implemented app in Nearby mode. GPS controls stay on Map while this screen prioritises cards, filters and scrolling. These regression captures deliberately use empty cloud configuration, so the device-only sharing notice describes the test configuration; the deployed app retains its real shared backend.*

![Revised photo memory detail](screenshots/iteration-05-photo-detail.png)

*Persistent close toolbar, larger story text and a complete synthetic test image. The teal graphic is a browser-drawn fixture, not a photograph from a visited place.*

### Verification and issues caught

**13 Node checks and 20 device-only browser checks passed.** The existing GPS permission/retry, temporary failure, proximity uncertainty, stale fix, local photo persistence/deletion and storage-error checks still pass. No backend schema, ownership policy or discovery threshold changed in this cleanup; the seven live backend checks from Iteration 04 were not rerun for this interface-only increment.

New checks cover 320 × 568, 390 × 844, 430 × 932 and 844 × 390 layouts: document bounds, full compact-card visibility, separation of GPS and preview controls, reachable creation controls, a 44 px list-toggle target, switching navigation state, scrolling to and opening the last card, title search, closing a long memory after scrolling, and reaching form controls in a reduced-height viewport. The small-phone bounds check initially failed; correcting hidden-element positioning removed the document overflow. A later check caught a card clipped after spacing changes, and increasing the short-screen preview allocation corrected it. These failures were fixed rather than treating a successful wide-screen render as proof of mobile usability.

[Browser results](iteration-05-browser-results.txt) · [Node results](iteration-05-node-results.txt)

### Reflection and limits

The main improvement is assigning different jobs to the two views: Map keeps place visible, while Nearby gives stories enough space. Showing one preview is a deliberate tradeoff; the count and View list button communicate that more Echoes exist. In a very short viewport, the preview omits the story excerpt and keeps the title/action; the full list remains available.

This is a tested browser layout improvement, not proof that Joshua has found the phone experience satisfactory. Actual iOS Safari/Android Chrome browser chrome, the keyboard opening, safe-area insets, landscape use and screen-reader behaviour still need hands-on checks. The reduced-height browser test is a useful approximation, not a physical keyboard test. Outdoor GPS evaluation, participant observations, the final 1–3 minute showreel and Joshua’s personal final reflection remain outstanding. The completed Task 2 sections are preserved.


**Deployment:** [Application PR #2](https://github.com/joshpilcher/urban-echo/pull/2) was merged as `461c3f136affe39ed789135e64f86009682a8b65`. The [Pages run](https://github.com/joshpilcher/urban-echo/actions/runs/39538677491) completed successfully and the published version 0.3.1 source was checked for the updated list toggle, detail toolbar and mobile stylesheet rules. The screenshots above are actual local browser renders of the tested implementation, rather than captures of a physical phone. The completed Task 2 HTML remains byte-for-byte unchanged.


## 21 October 2026 — Iteration 06: more of the screen belongs to the map

Joshua’s next feedback was that more of the map should cover the screen, the starting view should be closer, and the Nearby Echoes/recenter window should move out of the way. Iteration 05 improved reading, but its preview still occupied a substantial part of the mobile map. This update follows that more specific feedback.

### Changes

The mobile Map now fills the content area without an Echo list or memory-preview sheet over it. Cards remain in Nearby and My Echoes, and map pins still open memory details directly. Create Echo floats at the lower left and the recenter button sits at the lower right. The full Nearby list remains a separate navigation choice rather than appearing by default on Map. The larger desktop layout retains its sidebar.

The location window is replaced on mobile by a small top-left GPS chip. Before tracking it says Enable GPS; once an accurate fresh fix is available, GPS active opens accuracy, freshness and Stop tracking details. The details can be closed without stopping tracking. GPS failures open their explanation automatically, and a subsequent good fix closes that automatic notice. There is still no location request on page load.

The initial regional zoom changes from 12 to 13. The first GPS-centred view and recenter change from 16 to 17, giving a closer street-level view. The location itself, discovery radius, accuracy handling and 30-second freshness policy are unchanged. The keyboard skip link opens Nearby and moves focus without scrolling the app header away.

### Evidence and verification

![Map before this adjustment](screenshots/iteration-05-mobile.png)

*Previous iteration: the preview was readable, but still took a large portion of Map. Simulated GPS browser capture.*

![Map filling the mobile content area](screenshots/iteration-06-mobile.png)

*Implemented mobile Map after the adjustment, 390 × 844 browser viewport. Only compact GPS, Create and recenter controls remain over it. The banner identifies simulated GPS and synthetic memories; this is not an outdoor trial.*

![GPS details opened on demand](screenshots/iteration-06-location-details.png)

*The same screen after tapping GPS active. Tracking controls are available on demand rather than occupying the map continuously.*

**13 Node and 20 browser checks passed.** Updated cases verify full map coverage at 320 × 568, 390 × 844, 430 × 932 and 844 × 390; no default visible Echo list; compact GPS height; separated Create/recenter targets at least 44 px high; opening/closing location details; keyboard skip navigation; and access to the full Nearby list. Tile URLs generated by the actual Leaflet view confirm zoom 13 initially and 17 after the first simulated fix. Existing permission/retry, stop, stale-fix, proximity, photo persistence/deletion and storage-failure checks also pass. An old short-screen CSS rule initially kept tracking controls visible; removing that obsolete exception restored the compact GPS chip at small sizes.

[Browser results](iteration-06-browser-results.txt) · [Node results](iteration-06-node-results.txt)

### Reflection

This makes the original place-responsive idea more visible: the map is the main surface again, and reading/browsing is reached intentionally through a pin or Nearby. Hiding the preview means people must notice the pins or navigation; that tradeoff should be evaluated on a phone. The new closer view is a design choice rather than a field-validated optimum. It may need adjustment after actual walks or use in denser areas.

Physical phone browser chrome, touch behaviour, GPS accuracy and outdoor approach/reveal still require hands-on evaluation. No new participant feedback beyond Joshua’s request, real photographs or outdoor results have been invented. This interface increment makes no backend policy or storage changes, and does not repeat the earlier real shared-service tests. Completed Task 2 content remains preserved.


**Published:** [Application PR #3](https://github.com/joshpilcher/urban-echo/pull/3) was merged as `fc7f566b99e62529621ffad6335228c467b6b79e`. The [Pages deployment](https://github.com/joshpilcher/urban-echo/actions/runs/39541162068) succeeded. A fresh HTTPS request confirmed version 0.3.2 and the published initial/GPS zoom settings. The images above are local browser evidence of the tested mobile implementation, with simulated GPS explicitly labelled; they are not physical phone captures.
