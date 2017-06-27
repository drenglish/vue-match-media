# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
