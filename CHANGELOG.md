# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 1.0.0 - 2017-07-05
### Changed
- Version bump for release

## 0.2.0 - 2017-07-03
### Added
- Enable a "not" argument to onmedia directive
- Build distributable (strip Flow annotations)
### Changed
- Execute onmedia callback on bind only for matched $mq keys
- Add "init" flag to params when executing onmedia callback from bind
- README updates to clarify use of onmedia

## 0.1.0 - 2017-06-29
### Added
- Global mixin adds "$mq" key to the Vue prototype
- Component configuration of the $mq object
- Component option to declare an isolated $mq scope
- Convenience property "all" on $mq object returns array of all matched query keys
- An "onmedia" directive to allow component methods to be executed on change
- README documentation of current feature set
