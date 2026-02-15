# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

### Removed

## [0.18.2] - 2025-02-15

### Added

- Api documentation for all endpoints including error codes and authentication requirements.
- Readable error message for BASE_URL format issues.
- Auto generated (from git commits) changelog for old releases.

### Changed

- Updated android build config to allow plain text communication (optionally)


## [0.18.1] - 2026-02-03

### Fixed

- fix: remove service worker

## [0.18.0] - 2026-01-25

### Changed

- feat: add habit archive
- fix: release changelog creation
- fix: do not display checkmark for negative habits
- feat: add backend endpoint for updating habit status
- feat: add backend endpoint for getting archived habits
- Merge remote-tracking branch 'origin/main' into develop
- fix: habit computation
- fix: wrong default display name for oidc users
- feat: configure first day of week to sunday in activity calendar
- feat: add support for monthly and weekly negative habit goals
- feat: add public endpoint for server version and required app version
- fix: big numbers overflowing buttons
- fix: user info caching
- fix: images on github pages
- feat: compute target days dynamically depending on frequency
- feat: add real service worker for pwa
- feat: improve habit record fetching
- feat: enable async login to improve app loading time
- feat: improve performance
- fix: shared habit medals
- Update CNAME
- docs: add webpage

## [0.17.2] - 2026-01-15

### Changed

- fix: notifications not working with postgres
- Update docker-compose-apprise.yml (#161)

## [0.17.1] - 2026-01-14

### Changed

- fix: issues display of habit config
- fix: issues when checking time period validity
- fix: apprise-target-url editing

## [0.17.0] - 2026-01-11

### Changed

- feat: improve habit grouping performance
- fix: database issues after update
- BREAKING CHANGE: Moved docker user config. See README
- fix: reserved keyword in both h2 and postgres
- chore: mark habit groups as experimental
- fix: postgres
- fix: hide challenge screen completely
- feat: make distinction between sharing and collaborating more clear
- fix: prevent errors when no mail configured
- Update README.md
- feat: make user id configurable
- feat: add arm64 build
- Feature/group habits (#134)
- Update README-Home-Assistant.md
- Update copyright year in LICENSE file

## [0.16.6] - 2025-12-30

### Changed

- fix: habit completions appear yesterday for negative timezones
- fix: habit group name field
- feat: add habit group backend
- feat: add api endpoint for new sort endpoint react
- feat: add new sorting endpoint, groups to backend
- feat: add option to hide challenge view globally

## [0.16.5] - 2025-12-08

### Changed

- feat: use template for date format
- fix: docker health check

## [0.16.4] - 2025-11-03

### Changed

- fix: show havit where i am invited to
- fix: handle issuers with trailing slash configured
- Update README.md

## [0.16.3] - 2025-10-29

### Changed

- feat: check notification triggers on record update
- fix: delete habit from notification cache when deleted
- feat: immediately execute notification rules on change
- feat: remove unused percentage graph functionality
- feat: improve notification performance
- fix: streak notifications if completed but not yet streak
- feat: use local storage to cache habits

## [0.16.2] - 2025-10-28

### Changed

- fix: update of habit records

## [0.16.1] - 2025-10-28

### Changed

- feat: improve artefact sizes
- fix: loading of shared habits
- fix: shared habits
- fix: caching

## [0.16.0] - 2025-10-27

### Changed

- fix: android build
- feat: make habit record updates optimistic
- fix: invitations caching and checking
- fix: Notification Config modal flickering
- fix: Dockerfile
- fix: unneeded refetch
- fix: display weekday filter when locked
- fix: update shared habit on join
- fix: do not show copy share link when joining habit
- fix: beta version version
- feat: add beta release
- feat: add simple build tests on mrs on develop or main
- docs: add support_request.md
- docs: add weekday selection
- fix: activity calendar use hooks
- feat: add helpme page
- fix: swagger ui now directly usable
- docs: remove unmaintained TODO list
- chore: performance optimizations
- fix: clear all data when user logs out
- feat: filter habit by weekday
- Update README.md
- Update README.md
- fix: notification modal updates
- fix: wrong config indicator when switching between types
- fix: habit details goal for negative habits
- fix: sizes of big numbers / decimals in habit tracker

## [0.15.4] - 2025-10-22

### Changed

- fix: oidc issues on web
- Update README.md

## [0.15.3] - 2025-10-21

### Changed

- fix: challenge view update
- fix: negative habit defaults
- fix: increase color option margin

## [0.15.2] - 2025-10-21

### Changed

- feat: add debug info if oauth fails, improve login flow
- Update README.md

## [0.15.1] - 2025-10-19

### Changed

- fix: notification when streak is lost
- feat: add copy api key button
- docs: update README
- fix: release changelog gen
- feat: optimize number modal
- fix: do not update default tracker value on shared habit sync
- feat: do not allow multiple shared habits per habit
- fix: loop habit import description

## [0.15.0] - 2025-10-18

### Changed

- Caching frontend (#82)
- feat: add loop habits import pt 2
- feat: add loop habits import

## [0.14.3] - 2025-10-16

### Changed

- fix: activity graph
- fix: weekly achievement when negative

## [0.14.2] - 2025-10-15

### Changed

- fix: HabitRecordService

## [0.14.1] - 2025-10-15

### Changed

- fix: authentication issues
- fix: habit record completion in quick view
- fix: progress computation for negative habits with custom frequency
- fix: habit colors in habit tracker view
- fix: activity calendar caching
- fix: keyboard type
- fix: habit calendar caching
- fix: negative completion display

## [0.14.0] - 2025-10-15

### Changed

- feat(negative-habits): add support for negative habits

## [0.13.2] - 2025-10-13

### Changed

- fix: progress future/not future
- fix: remove chart view in mobile app for now
- chore: update deps
- deps: update
- fix: add reanimated

## [0.13.1] - 2025-10-13

### Changed

- fix: victory chart imports

## [0.13.0] - 2025-10-13

### Changed

- feat: add Chart to habit details view
- fix: overtake notification template
- fix: caching of progress
- fix: logo

## [0.12.1] - 2025-10-12

### Changed

- fix: update ActivityCalendar.tsx
- chore: remove logs
- fix: share code on mobile devices
- docs: update todos
- fix: overtake notification template
- fix: caching of habit completion
- fix: caching of habit records
- fix: token refresh error

## [0.12.0] - 2025-10-11

### Changed

- docs: add home assistant examples to README
- feat: add simple record api

## [0.11.2] - 2025-10-10

### Changed

- fix: api key ui
- feat: improve caching
- feat: add api keys to frontend
- feat: cache number modal and habit records
- docs: add api usage example

## [0.11.1] - 2025-10-10

### Changed

- fix: visual bugs, and notification config

## [0.11.0] - 2025-10-10

### Changed

- feat: add function to trigger notification only if streak will be lost
- fix: sharing and retries of api calls
- fix: picker for mobile app
- fix: padding
- fix: add padding to icon
- feat: add cachingProgressService

## [0.10.3] - 2025-10-08

### Changed

- fix: logo
- fix: api-key db migrations, extend readme
- feat: do not allow more than one full completion per day

## [0.10.2] - 2025-10-08

### Changed

- fix: share modal size
- fix: recreation of account when participating
- fix: bug when inviting users that do not exist

## [0.10.1] - 2025-10-08

### Changed

- fix: habit modal and buttons visuals
- feat: allow floats as values
- feat: add new habit sharing to frontend
- feat: add accept invitation fields to profile
- feat: add participant api config to frontend
- feat: add controller setup for api key support
- feat: add auth setup for api key support
- feat: add database setup for api key support
- feat: add endpoints for invitations

## [0.10.0] - 2025-10-07

### Changed

- feat: change maintenance mode warning
- feat: backend implementation for habit participation
- fix: android icon
- fix: statusbar color + navigation bar color

## [0.9.1] - 2025-10-06

### Changed

- fix: statusbar color
- fix: statusbar color

## [0.9.0] - 2025-10-06

### Changed

- feat: add support for postgres
- docs: remove merge commits from changelog
- docs: update readme to include mobile app
- fix: chevron color on shared habits
- fix: chevron on habit tracker page
- fix: android icons

## [0.8.0] - 2025-10-04

### Changed

- Update release.yml
- fix: release download apk
- fix: improve styling
- fix: improve styling of number modal
- fix: open details on mobile
- fix: alignment of day buttons
- fix: marginTop of views
- fix: padding of details view
- fix(mobile): open details view

## [0.7.12] - 2025-10-01

### Changed

- fix: android deployment
- fix: deployment
- feat: make recordDate optional and default to current day
- chore: remove unused redirect controller
- feat: add local android apk build with signing and improve release.yml

## [0.7.11] - 2025-09-30

### Changed

- fix: remove static config vars

## [0.7.10] - 2025-09-30

### Changed

- fix: remove non functional android config

## [0.7.9] - 2025-09-30

### Changed

- fix: api connection
- feat: add draft for mobile app build to release pipeline
- fix: mobile app redirect setup

## [0.7.8] - 2025-09-30

### Changed

- feat: add mobile callback redirect endpoint
- feat: setup mobile app build
- feat: improve mail sending
- chore: remove old notification service
- feat: add support for mobile apps pt 1

## [0.7.7] - 2025-09-30

### Changed

- fix: reordering of habits
- fix: challenge end time display
- fix: deletion of habits
- docs: update / improve readme
- Update issue templates

## [0.7.6] - 2025-09-13

### Changed

- feat: move habit notification config to habit details view
- feat: add transparent icon for pwa
- feat: add option for custom login message

## [0.7.5] - 2025-09-12

### Changed

- feat: add new icons everywhere
- fix: pwa icons

## [0.7.4] - 2025-09-12

### Changed

- fix: number modal

## [0.7.3] - 2025-09-12

### Changed

- feat: improve ui
- feat: new icon
- feat: improve ui
- feat: improve challenge screen
- fix: evaluate shared habit medals on second day to avoid timezone issues
- fix: improve retries when fetching content
- feat: improve number modal
- fix: do not allow non owners to edit sharedhabit property allowEditingByAll
- fix: dark mode of join habit modal
- feat: check rules more regularly, improve caching

## [0.7.2] - 2025-09-12

### Changed

- fix: threshold description
- feat: dont trigger notifications when created
- fix: avoid retriggering of sent notifications
- fix: account updates when no apprise url is set
- feat: remove delete all notifications button
- feat: add html templates for new rules
- fix: delete notification jobs when habit is deleted
- feat: extend notification config

## [0.7.1] - 2025-09-11

### Changed

- docs: add apprise to readme
- feat: extend notification system
- feat: add apprise
- chore: Readability NotificationServiceNew
- docs: fix docker compose apprise example
- feat: add support for apprise

## [0.6.4] - 2025-09-09

### Changed

- fix: do not show basic auth popup in clients

## [0.6.3] - 2025-09-08

### Changed

- feat: enable openapi doc and swagger api
- feat: add custom exception handler in filter chain to avoid basic auth popup in browser
- fix: visuals

## [0.6.2] - 2025-09-08

### Changed

- fix: require approval of accounts
- docs: improve oidc documentation

## [0.6.1] - 2025-09-08

### Changed

- fix: design of plus sign, welcome page
- docs: fix basic auth explanation
- fix: login button color

## [0.6.0] - 2025-09-07

### Changed

- fix: visuals of ActivityCalendar.tsx
- fix: always show first day in activity calendar
- feat: do not hide own habit in shared habits view on habit details page
- fix: habit details view text color dark mode
- feat: new colors for habits
- feat: improve challenge view
- feat: improve challenge config

## [0.5.1] - 2025-09-06

### Changed

- fix: notifications

## [0.5.0] - 2025-09-06

### Changed

- feat: improve goal display
- feat: improve plus button design
- docs: update readme
- feat: improve habit configuration
- fix: sending of mails

## [0.4.8] - 2025-09-05

### Changed

- fix: notification

## [0.4.7] - 2025-09-05

### Changed

- fix: notification

## [0.4.6] - 2025-09-05

### Changed

- fix: notification

## [0.4.5] - 2025-09-05

### Changed

- fix: notification

## [0.4.4] - 2025-09-05

### Changed

- fix: frequencypicker style
- fix: timezone

## [0.4.3] - 2025-09-05

### Changed

- fix: frequencypicker dark mode
- fix: timezone issue

## [0.4.2] - 2025-09-05

### Changed

- fix: flyway baseline

## [0.4.1] - 2025-09-05

### Changed

- fix: flyway baseline

## [0.4.0] - 2025-09-05

### Changed

- feat: split challenge change and challenge result computation
- feat: Mark target days as advanced setting
- feat: display local timezones for notification settings
- fix: timezone of JVM to UTC
- feat: add notifications to habits

## [0.3.0] - 2025-09-04

### Changed

- feat: improve challenge configs and display
- feat: improve security when storing tokens
- fix: improve naming of habit target days
- docs: update readme
- docs: fix docker run in README

## [0.2.3] - 2025-09-04

### Changed

- fix: inconsistencies with habit records

## [0.2.2] - 2025-09-04

### Changed

- fix: number modal wake lock
- fix: challenge ui

## [0.2.1] - 2025-09-04

### Changed

- fix: challenge ui
- fix: activity calendar
- fix: instructions on how to configure basic auth users
- docs: improve release info

## [0.2.0] - 2025-08-15

### Changed

- docs: improve README.md

## [0.1.0] - 2025-08-15

### Changed

- fix: changelog generation in release.yml
- fix: challenge display with no active challenges
- fix: dark mode
- fix: remove .env from deployment
- fix: rename github workflow

## [0.0.1] - 2025-08-14

### Changed

- feat: add release config
- fix: visuals, config
- feat: add "test"
- feat: simplify creation of habits
- fix: login using basic auth
- improve config
- fix: issues when no challenge is running
- feat: create combined Dockerfile, serve ui from spring boot
- chore: remove old unused assets
- chore: reorder repository
- feat: use bcrypt as basic auth encryption, extend documentation
- fix: issues keeping user logged in
- add draft picture
- add README
- Initial commit
