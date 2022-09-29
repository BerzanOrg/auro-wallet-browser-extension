# Changelog
All notable changes to this project will be documented in this file.


## [Un-Released]

## [2.1.0]
- New UI
- upgrade mina-signer-experimental version to 1.3.0
- fix nodeEditor net type

## [2.0.6]

- upgrade mina-signer-experimental version to 1.2.1
- fix (ledger): signing not working on testnet
- fix change password failed when have ledger account

## [2.0.5]

- fix DApp default icon
- change DApp message request page title
- fix address-book 
- add berkeley-qa support (mina-signer-experimental)
- update auro-web3-provider to @aurowallet/mina-provider
- add berkeley-qa signParty
- add gql params type
- set default net type to Berkeley-QA

- [main]
- update build production scripts
- update the page display logic of network control
- update mina-signer init params to mainnet
- update signMessage params name to message
- fix update the current network url not timely problem 

## [2.0.4]

- Re-encode raw signature to fix ledger transation signature  (https://github.com/jspada/ledger-app-mina/pull/22)
- fix no-balance account tip

## [2.0.3]

### Fixed
- add old version network default-name [`Unknown`]
- add ledger transaction tip when waiting sign in ledger
- fix send default button status 
- fix networkPage delete button 
 

## [2.0.2]

### Changed
- change permission `tabs` to `activeTab`


## [2.0.1]

### Added
- Support Dapp
- Support Devnet
- Improve user experience and features optimization:
- Add `All` feature when sending, change the default explorer, transaction fees and other humanized tips.
- Deprecated import watch account(Forced).

### Fixed
- Bug fix

