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

**Development files:** [Urban Echo prototype](../app/) · [Task 2 process journal](../index.html)
