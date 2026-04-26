This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

## Database Management Scripts

### Update User Name
Updates a user's name across all tables (User, GameDay, Game).

```bash
# to run the script
npm run update-user-name <username> <oldName> <newName>

# Example
npm run update-user-name admin 管理 dan
```

### Update Player Name

Updates a player's name across all tables (Player, GameDay, Game, Payout).

```bash
# to run the script
npm run update-player-name <oldName> <newName>

# Example
npm run update-player-name "娜娜" "孤单"
```

### Database Seed
Seeds the database with initial data.

```bash
# to run the script
npm run db:seed
```

## Future Ideas

### Blockchain Integration Possibilities

#### 1. Player Achievements NFTs
- Mint special NFTs for season winners
- Achievement NFTs for milestones:
  - First 1000¥ balance
  - Longest win streak
  - Season participation proof
- Historical record of player accomplishments

#### 2. On-Chain Game Results
- Record game outcomes as immutable transactions
- Create verifiable game history
- Enhance transparency and dispute resolution
- Permanent record of matches and seasons

#### 3. Token Economy (豆Token/DOZI)
- Native platform token for the ecosystem
- Convert game winnings to tokens
- Enable token features:
  - Player-to-player trading
  - Match entry fees
  - Game staking system

#### 4. Smart Contract Automation
- Automate payment distribution
- Smart contract-managed:
  - Season rewards
  - Tournament prizes
  - Daily game settlements

#### 5. DAO Governance
- Community voting system for:
  - Rule modifications
  - Season planning
  - Feature requests
- Voting power based on:
  - Participation level
  - Achievement status
  - Token holdings

### 6. Sponsorships
- Sponsorships for players
- Sponsorships for game days
- Sponsorships for seasons

