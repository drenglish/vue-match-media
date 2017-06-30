# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 0.9.0 - 2017-06-30
### Added
- README documentation of current feature set
- Version bump bc we seem basically feature-complete at this point
### Changed
- Directive seems slightly more useful set up from inserted() hook
- package.json cleanup

## 0.5.0 - 2017-06-30
### Added
- Let "onmedia" directive accept a "not" argument

## 0.4.0 - 2017-06-29
### Added
- An "onmedia" directive to allow component methods to be executed on change

## 0.3.0 - 2017-06-27
### Added
- Reactive properties enabled on $mq object
### Fixed
- Initial form of option merge was naive and didn't support reactivity

## 0.2.0 - 2017-06-26
### Added
- Convenience property "all" on $mq object returns array of all matched query keys
### Fixed
- Added a proper matchMedia mock for testing

## 0.1.0 - 2017-06-25
### Added
- An "$mq" property on the Vue prototype
- Component configuration of the $mq object via global mixin
- Component option to declare an isolated $mq scope
