# Changelog

## [2.6.0](https://github.com/MeninoNias/lofi-bot/compare/v2.5.0...v2.6.0) (2026-01-30)


### Features

* add profile, rank, and globalrank commands with level-up notifications ([9673d9a](https://github.com/MeninoNias/lofi-bot/commit/9673d9ae48421d6a0b801d0a00d1f08c6467ba4d))
* add ProfileService for XP tracking on bot interactions ([b98e81b](https://github.com/MeninoNias/lofi-bot/commit/b98e81bb35d9dba2d125e95f73450415bf51de18))
* add user profile and guild user stats models ([fc39165](https://github.com/MeninoNias/lofi-bot/commit/fc39165271723a217b75e13e728c613532ebe914))
* add user profile and guild user stats models ([81f41bf](https://github.com/MeninoNias/lofi-bot/commit/81f41bfe01893369d5919c26136d63c9594ee947)), closes [#25](https://github.com/MeninoNias/lofi-bot/issues/25)
* store Discord user and guild info in database ([6f8e84e](https://github.com/MeninoNias/lofi-bot/commit/6f8e84e3be6d59a180a217c32e92368f5b378307))

## [2.5.0](https://github.com/MeninoNias/lofi-bot/compare/v2.4.0...v2.5.0) (2026-01-30)


### Features

* protect API endpoints with X-API-Key authentication ([841bd66](https://github.com/MeninoNias/lofi-bot/commit/841bd66469f5538286fb2189f94b6615ee1ae159))
* protect API endpoints with X-API-Key authentication ([3aa0194](https://github.com/MeninoNias/lofi-bot/commit/3aa01941889a116bfdbe9f9810263bd1b463ce2d)), closes [#21](https://github.com/MeninoNias/lofi-bot/issues/21)

## [2.4.0](https://github.com/MeninoNias/lofi-bot/compare/v2.3.0...v2.4.0) (2026-01-26)


### Features

* add health check endpoint and command ([a16dbee](https://github.com/MeninoNias/lofi-bot/commit/a16dbee9df5bc3401b1d811695fcf845fbfc2021))
* add health check endpoint and command ([46181bb](https://github.com/MeninoNias/lofi-bot/commit/46181bb854ffbd8cdab3b5e1b17c907289d3e3df)), closes [#11](https://github.com/MeninoNias/lofi-bot/issues/11)
* auto-stop bot when all users leave voice channel ([65ae925](https://github.com/MeninoNias/lofi-bot/commit/65ae9258f7806f883860432b46e906ecf92bfbc7))
* auto-stop bot when all users leave voice channel ([a82ef32](https://github.com/MeninoNias/lofi-bot/commit/a82ef3228a7523792ae53e32f7af722ab83883ae)), closes [#13](https://github.com/MeninoNias/lofi-bot/issues/13)


### Bug Fixes

* prevent double-destroy error in AudioService cleanup ([5eafc48](https://github.com/MeninoNias/lofi-bot/commit/5eafc48e14874d468e477a092afe4fecabaf088e)), closes [#16](https://github.com/MeninoNias/lofi-bot/issues/16)
* prevent double-destroy error when using !stop command ([3d14ac4](https://github.com/MeninoNias/lofi-bot/commit/3d14ac43e831027d611bd53e546bc08f50efea80))

## [2.3.0](https://github.com/MeninoNias/lofi-bot/compare/v2.2.1...v2.3.0) (2026-01-22)


### Features

* add pino structured logging and fix stream timeout warnings ([cbce708](https://github.com/MeninoNias/lofi-bot/commit/cbce708d15bb4a3b492dae98f504cb213f9978ae))
* add pino structured logging and fix stream timeout warnings ([bb2352d](https://github.com/MeninoNias/lofi-bot/commit/bb2352d497dfff9c85c024eb219254f8ace33b06))

## [2.2.1](https://github.com/MeninoNias/lofi-bot/compare/v2.2.0...v2.2.1) (2026-01-22)


### Bug Fixes

* update banner image path in README ([51db8cb](https://github.com/MeninoNias/lofi-bot/commit/51db8cbe7362cba93f0b091c3b2bddfccac59dbf))
* update banner image path in README ([8b8c99a](https://github.com/MeninoNias/lofi-bot/commit/8b8c99af61fa88a265e97f4ce9ff75812381541e))

## [2.2.0](https://github.com/MeninoNias/lofi-bot/compare/v2.1.0...v2.2.0) (2026-01-22)


### Features

* add Docker setup and improve documentation ([965183b](https://github.com/MeninoNias/lofi-bot/commit/965183beda47c50e7d3a5c8f79e6b35b3a1b8ea3))

## [2.1.0](https://github.com/MeninoNias/lofi-bot/compare/v2.0.0...v2.1.0) (2026-01-22)


### Features

* add Dockerfile and docker-compose.yml for containerized setup ([2fd52d9](https://github.com/MeninoNias/lofi-bot/commit/2fd52d9870741f6cec0a828d5a59b2b858359e70))


### Bug Fixes

* resolve TypeScript strict type checking errors ([baf2d92](https://github.com/MeninoNias/lofi-bot/commit/baf2d92cf4b32b1c53bedea920333fff71b9a3f7))

## [2.0.0](https://github.com/MeninoNias/lofi-bot/compare/v1.0.0...v2.0.0) (2026-01-22)


### ⚠ BREAKING CHANGES

* Requires PostgreSQL database. Set DATABASE_URL in .env.

### Features

* Add ESLint and Prettier configuration, update dependencies, and enhance scripts ([08e2ced](https://github.com/MeninoNias/lofi-bot/commit/08e2cedad10a00bf33313f7fd651017ba5a49da0))
* refactor to MVC architecture with PostgreSQL support ([ea028e8](https://github.com/MeninoNias/lofi-bot/commit/ea028e8a6c4475a2a4d003c5890fed1ff1bb9387))

## 1.0.0 (2026-01-22)


### Features

* Add Discord lofi radio bot implementation ([4eb0138](https://github.com/MeninoNias/lofi-bot/commit/4eb0138520678f6532dd5fff2a71ca2487a03a49))
