## [Unreleased]

### Changed
- Removed team leader system - all members now have a fixed budget of 1400U
- Updated database schema to remove `is_leader` column from members table
- Updated UI to remove leader indicators (∞ symbol) and special handling
- All members now display budget progress bars consistently

### Added
- Enhanced team management with member management functionality
- Ability to move members between teams
- Ability to remove individual members from teams
- Team deletion now automatically deletes all team members (cascading delete)
- Confirmation dialog shows which members will be deleted with the team

### Fixed
- **CRITICAL**: Preserved historical expenditure data when teams/members are deleted
- Added `team_name_historical` and `member_name_historical` fields to expenditures
- Expenditures now display historical names for deleted teams/members
- Removed cascading delete from expenditures to teams (now uses SET NULL)
- Historical data integrity maintained for accurate reporting
- Member deletion now preserves expenditure records with historical member names
- Updated frontend to display historical member names for deleted members
- **MAJOR**: Removed 1400U budget limits from all members (unlimited budgets)
- Updated progress bars to show spending amounts instead of budget percentages
- Changed dashboard to display "Unlimited" budget status
- Members now show "X spent" instead of "X / 1400U" 