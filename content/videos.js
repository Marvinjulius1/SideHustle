// 55 Video-Skripte, Serie "Winter Arc". Sprache: Englisch.
// hook    = großer Text oben im Bild, während die Figur zur Kamera läuft
// lines   = gesprochene Sätze (Untertitel zeigen genau diesen Text)
// caption = Beschreibungstext für TikTok/Instagram (Hashtags + Werbehinweis kommen automatisch dazu)
// Das Ende (Call-to-Action) ist in content/config.json festgelegt und bei jedem Video gleich.
// Regeln: keine Gewinnversprechen, keine konkreten Kaufempfehlungen, Beträge ohne "$"-Zeichen.

const V = (day, id, hook, lines, caption) => ({ day, id, hook, lines, caption });

export const VIDEOS = [
  V(1, 'winter-arc-intro', 'Day 1 of my crypto winter arc', [
    'Welcome to my winter arc.',
    "For the next fifty five days, I'm breaking down crypto, memecoins and trading, one short lesson a day.",
    'No hype and no fake flexing, just the stuff I wish someone had told me before my first trade.',
    'Most people lose money in crypto because they skip the basics.',
    "We're not doing that.",
  ], 'Day 1. 55 days of crypto, memecoins and trading lessons. Are you in?'),

  V(2, 'what-is-a-memecoin', 'What is a memecoin, really?', [
    'A memecoin is a token that runs on vibes, not on a product.',
    'No cash flow, usually no real use case, just a joke, a community and attention.',
    'Its price moves on one thing: whether more people want to buy it tomorrow than today.',
    "That's why some go up 100x, and why most of them go to zero.",
    'If you trade them, treat it like a high risk game, not like an investment.',
  ], 'Memecoins explained in 30 seconds. What was your first one?'),

  V(3, 'why-memecoins-die', 'Why most memecoins go to zero', [
    'Most memecoins go to zero. Here is why.',
    'Thousands of new tokens launch every single day.',
    'Attention is limited, so almost all of them die within days.',
    'Creators and early buyers often sell into the hype, and late buyers are left holding the bag.',
    'So before you buy, ask one question: who is going to buy this after me, and why?',
  ], 'The question that saves you from most bad memecoin buys.'),

  V(4, 'rug-pull', 'How a rug pull works', [
    'What is a rug pull?',
    'A developer launches a token, hypes it up, and once enough people have bought, they pull the liquidity or dump their whole bag.',
    "The price crashes to almost zero in seconds, and there's nothing you can do.",
    "Red flags: an anonymous team, a huge developer wallet, and liquidity that is not locked or burned.",
    'If it looks too perfect, it probably is.',
  ], 'Rug pulls explained. Ever been rugged?'),

  V(5, 'honeypot', 'You can buy it. You can never sell it.', [
    'Some tokens let you buy, but never sell.',
    "That's called a honeypot.",
    'The smart contract has hidden code that blocks selling for everyone except the developer.',
    'The chart looks amazing because nobody is able to sell.',
    'Before buying anything new, run the contract through a token scanner and check if other wallets have actually sold.',
  ], 'Honeypot tokens: the scam where the chart only goes up.'),

  V(6, 'market-cap-vs-price', 'Stop looking at the price', [
    'Stop looking at the price. Look at the market cap.',
    "A token at one cent is not cheap if there are a trillion of them.",
    'Market cap is price times circulating supply. It tells you how big the thing already is.',
    'Going from ten million to a hundred million is a very different bet than going from ten billion to a hundred billion.',
    'A cheap price means nothing. Size means everything.',
  ], 'Why a 1 cent coin is not "cheap".'),

  V(7, 'fdv', 'The number that hides the dump', [
    'Market cap can lie. Check the fully diluted valuation.',
    "FDV is the price times the total supply, including tokens that are still locked.",
    'If the market cap is fifty million but the FDV is one billion, a lot of new tokens are coming.',
    'When they unlock, early investors often sell, and the price gets pushed down.',
    'Low float and high FDV is a classic trap.',
  ], 'Market cap vs FDV. Check this before you buy.'),

  V(8, 'liquidity', 'The most underrated number in crypto', [
    'Liquidity is the most underrated number in crypto.',
    "It's how much money sits in the pool you trade against.",
    'Low liquidity means one big seller can crash the price, and your own sell order can move the chart against you.',
    'A token can show a huge market cap with only a tiny bit of liquidity behind it.',
    "Gains you are unable to sell are only numbers on a screen.",
  ], 'Liquidity explained. Gains you cannot sell are not gains.'),

  V(9, 'slippage', 'Why you got a worse price', [
    'You bought at one price but got a worse one. That is slippage.',
    'On thin memecoin pools, every buy pushes the price up while your order fills.',
    'If you set your slippage tolerance super high, bots can take advantage of you.',
    'Keep it as low as the trade allows, and never throw a huge order into a tiny pool.',
  ], 'Slippage explained in under a minute.'),

  V(10, 'sandwich-attack', 'Bots are trading against you', [
    'Bots are front running your trades. Here is how.',
    'When you send a big swap, a bot can see it before it is confirmed.',
    'It buys right before you, lets your order push the price up, then sells right after you.',
    'You get a worse price and the bot keeps the difference. That is called a sandwich attack.',
    'Low slippage and protected transaction settings make you a much worse target.',
  ], 'Sandwich attacks: how bots eat your trades.'),

  V(11, 'check-holders', 'Check this before you buy', [
    'Before you buy a memecoin, check the holders.',
    'Open the token on a blockchain explorer and look at the top wallets.',
    'If a handful of wallets own a huge chunk of the supply, they control the price.',
    'Also watch for many fresh wallets that bought in the same second. That is often one person splitting their bag.',
    "Concentrated supply means you're playing their game.",
  ], 'The 30 second holder check that saves your money.'),

  V(12, 'snipers', 'Why it dumps right after launch', [
    'Ever wonder why a chart dumps right after launch?',
    'Snipers are bots that buy in the very first seconds.',
    "They do not care about the project. They wait for real buyers, then sell into them.",
    'If early wallets hold a big share, expect heavy selling pressure.',
    'Being first is not always an edge. Sometimes it just means you are competing with machines.',
  ], 'Snipers explained. You are not early, the bots are.'),

  V(13, 'fomo', 'The most expensive feeling in crypto', [
    'FOMO is the most expensive feeling in crypto.',
    'You see a coin up three hundred percent, and your brain screams that you are missing out.',
    'But by the time it is all over your feed, the early people are already selling to you.',
    "Make a rule: if it's already on every timeline, you never chase the green candle.",
    "There's always another trade. There's only one bank account.",
  ], 'FOMO has cost more money than any bear market. Agree?'),

  V(14, 'revenge-trading', 'How one loss becomes a blown account', [
    'You lose a trade, and you instantly want the money back.',
    "So you go bigger, faster and sloppier. That's revenge trading.",
    'It turns one small loss into a blown account.',
    'After a painful loss, close the app. Go for a walk. Come back tomorrow with a clear head.',
    'The market will still be there. Make sure your money is too.',
  ], 'Revenge trading: the fastest way to zero.'),

  V(15, 'position-sizing', 'The rule that keeps traders alive', [
    'The number one rule that keeps traders alive: position size.',
    "Decide how much you're willing to lose on one trade before you enter.",
    'Many traders cap that at one or two percent of their account per trade.',
    "That way, even ten losses in a row will not knock you out.",
    "The market is out of your control. Your size is in your control.",
  ], 'Position sizing is the most boring and most important skill.'),

  V(16, 'stop-loss', 'Your emergency exit', [
    'A stop loss is your emergency exit.',
    'It is an order that sells automatically if the price drops to a level you picked in advance.',
    "You decide where you're wrong while you're calm, not in the middle of a panic.",
    'Heads up: in thin memecoin pools or fast crashes, a stop can fill worse than planned.',
    'Still, a plan with an exit beats hoping. Every single time.',
  ], 'Stop losses explained. Do you use them?'),

  V(17, 'take-profits', 'Nobody goes broke taking profits', [
    'Nobody goes broke taking profits.',
    'When a trade doubles, many traders sell their initial amount.',
    "Now the rest is playing with profit, and it's much easier to think clearly.",
    'Round trips hurt: watching a big gain turn back into a loss because you got greedy.',
    'Write your take profit levels down before you buy.',
  ], 'Round tripping a winner hurts more than a loss.'),

  V(18, 'trading-journal', 'My most underrated trading tool', [
    'My most underrated trading tool is a journal.',
    'For every trade: why I entered, where my exit was, how I felt, and what happened.',
    'After a month, the patterns are brutal. You see exactly which mistakes cost you money.',
    'Pros review their trades. Gamblers forget them.',
    "Start today, even if it's just notes on your phone.",
  ], 'Journal every trade. Future you will thank you.'),

  V(19, 'leverage', 'Why people lose everything in one night', [
    'Leverage is why people lose everything in one night.',
    'With 10x leverage, a move of around ten percent against you can wipe out your whole position.',
    "It's called liquidation, and it happens automatically.",
    "Leverage will not make you a better trader. It makes your mistakes bigger and faster.",
    "If you're new, stay on spot until you really understand risk.",
  ], 'Leverage and liquidation explained.'),

  V(20, 'spot-vs-futures', 'Spot vs futures in 30 seconds', [
    'Spot versus futures, simply explained.',
    'Spot means you actually buy the coin. If it drops, you still own it.',
    'Futures are contracts that bet on the price, often with leverage, and you can get liquidated.',
    'On spot, time can heal a bad entry. On futures, a bad entry can end the trade for good.',
    'If you are a beginner, master spot first.',
  ], 'Spot or futures? Here is the difference.'),

  V(21, 'funding-rates', 'What the crowd is betting on', [
    'Funding rates tell you what the crowd is betting on.',
    'On perpetual futures, long and short traders pay each other a fee every few hours.',
    'When funding is very positive, lots of people are betting on up with leverage.',
    'That crowd can get liquidated fast if the price dips, which can cause a sharp drop.',
    'Extreme funding is a warning sign, not a buy signal.',
  ], 'Funding rates: the crowd indicator most beginners ignore.'),

  V(22, 'seed-phrase', 'These words are your money', [
    'Your seed phrase is your money.',
    'Anyone who has those words owns your wallet. Forever.',
    'Never type it into a website, never screenshot it, and never send it to support.',
    'Real support will never ask for it. Ever.',
    'Write it on paper or metal, and store it somewhere safe and offline.',
  ], 'Seed phrase rules. Share this with someone new to crypto.'),

  V(23, 'not-your-keys', 'Not your keys, not your coins', [
    'Not your keys, not your coins.',
    'When your crypto sits on an exchange, the exchange holds the keys.',
    "If it gets hacked, freezes withdrawals or goes bankrupt, you might not get your money back.",
    'It has happened before, even to some very big names.',
    'Exchanges are fine for trading. For long term holding, learn self custody.',
  ], 'Exchange or own wallet? Know the risk.'),

  V(24, 'wallet-drainers', 'One click can empty your wallet', [
    'One click can empty your whole wallet.',
    'Wallet drainers are fake sites that ask you to connect and sign a transaction.',
    'That signature can give them permission to move your tokens.',
    "Always check the link, bookmark the real sites, and read what you're signing.",
    'Use a separate wallet with small amounts for anything new.',
  ], 'Wallet drainers explained. Stay safe out there.'),

  V(25, 'fake-airdrops', 'Free tokens in your wallet? Careful.', [
    "Free tokens just appeared in your wallet? Leave them alone.",
    'Scammers send random tokens that point you to a website to claim or sell them.',
    'That website is often a drainer.',
    "If you did not expect it, ignore it. Most wallets let you hide it.",
    'In crypto, free money is usually bait.',
  ], 'Random airdrop in your wallet? Read this first.'),

  V(26, 'dm-scams', 'If they DM you first, it is a scam', [
    "If someone messages you first about crypto, it's almost always a scam.",
    'Fake support agents, fake traders selling signals, fake giveaways from famous accounts.',
    'They create urgency, so you act before you think.',
    "Real projects never slide into your messages asking you to connect your wallet.",
    'Block, report, move on. That includes anyone pretending to be me.',
  ], 'I will never DM you asking for money or your wallet.'),

  V(27, 'pig-butchering', 'The long con', [
    'Here is the long con.',
    'Someone befriends you online for weeks, then casually shows you their amazing trading profits.',
    'They guide you to a platform where your balance goes up and up.',
    'When you try to withdraw, suddenly there are fees, taxes and excuses.',
    "If you are unable to withdraw, it was never your money. Talk to someone you trust before sending anything.",
  ], 'Pig butchering scams are everywhere. Warn your friends.'),

  V(28, 'influencers', "Don't blindly follow crypto influencers", [
    'Never blindly follow crypto influencers. Including me.',
    'Some get paid to promote coins, and some buy before they post and sell to their followers.',
    'If someone shills a coin, ask: did they disclose it, and when did they buy?',
    'Use creators to learn concepts, not to get trade entries.',
    'Your money, your research, your decision.',
  ], 'Learn from creators. Do not copy their trades.'),

  V(29, 'checklist', 'My checklist before any new token', [
    'My quick checklist before any new token.',
    'One: is the contract scanned, and can people actually sell?',
    'Two: is the liquidity locked or burned?',
    'Three: how much do the top wallets hold?',
    'Four: is there a real community, or just bots?',
    'Five: how much am I willing to lose on this, completely?',
  ], 'Save this checklist for your next memecoin.'),

  V(30, 'crypto-winter', 'What is a crypto winter?', [
    'What is a crypto winter?',
    'It is a long bear market where prices fall and stay low for months, sometimes years.',
    'Hype disappears, volume dries up, and most tourists leave.',
    'Historically, a lot of builders and patient people did their best work during winter.',
    "Winter is for learning, building and preparing. That's the whole point of this series.",
  ], 'Day 30. Winter is for building.'),

  V(31, 'bull-vs-bear', 'Bull market or bear market?', [
    'Bull market or bear market?',
    'A bull market is a long period of rising prices and optimism.',
    'A bear market is a long period of falling prices and fear.',
    "In a bull market, everyone thinks they're a genius. In a bear market, you find out who had a plan.",
    'Your strategy should survive both.',
  ], 'Bull vs bear explained.'),

  V(32, 'halving', 'The Bitcoin halving explained', [
    'The Bitcoin halving, explained in thirty seconds.',
    'Roughly every four years, the reward miners get for new blocks is cut in half.',
    'That means new bitcoin supply grows more slowly.',
    'In the past, big bull runs came in the period after halvings. But the past guarantees nothing.',
    "Know the cycle, but never bet your rent on it.",
  ], 'The halving in 30 seconds.'),

  V(33, 'altseason', 'How people try to spot altseason', [
    'Altseason, and how people try to spot it.',
    "Bitcoin dominance is Bitcoin's share of the total crypto market.",
    'When money flows from Bitcoin into other coins, dominance drops and altcoins can outperform.',
    'Many traders watch dominance to judge how risky the market feels.',
    "Altseasons can be short and brutal. Never marry your bags.",
  ], 'Bitcoin dominance and altseason explained.'),

  V(34, 'stablecoins', 'The dollars of crypto', [
    'Stablecoins are the dollars of crypto.',
    'They are tokens designed to stay at one dollar, usually backed by cash and short term government bonds.',
    'Traders use them to park profits without leaving crypto.',
    "But stable is not the same as risk free. Some stablecoins have lost their peg before.",
    "Stick to big, transparent ones, and know who's behind them.",
  ], 'Stablecoins explained. Stable does not mean risk free.'),

  V(35, 'dca', 'Not everything has to be a trade', [
    'Not everything has to be a trade.',
    'Dollar cost averaging means buying a fixed amount on a schedule, no matter the price.',
    'You buy more when it is cheap, less when it is expensive, and you skip the stress of timing.',
    'Lots of people DCA for the long run and keep their trading money completely separate.',
    'Boring can be powerful.',
  ], 'DCA explained. Boring works.'),

  V(36, 'candlesticks', 'Read a candlestick in 30 seconds', [
    'How to read a candlestick in thirty seconds.',
    'Each candle shows four prices for a time period: open, high, low and close.',
    'Green means it closed higher than it opened. Red means it closed lower.',
    'The thin lines, called wicks, show how far the price moved before it got pushed back.',
    'Long wicks show you where buyers or sellers fought hard.',
  ], 'Candlesticks for beginners.'),

  V(37, 'support-resistance', 'Support and resistance, simply', [
    'Support and resistance, simply explained.',
    'Support is a price area where buyers have stepped in before.',
    'Resistance is an area where sellers keep showing up.',
    'When the price breaks through resistance with strong volume, that level can turn into new support.',
    "They're zones, not exact lines. Give them some room.",
  ], 'Support and resistance are zones, not lines.'),

  V(38, 'volume', 'Did anyone actually care?', [
    'Price tells you what happened. Volume tells you if anyone cared.',
    'A breakout on big volume shows real interest.',
    'A pump on tiny volume can be one wallet moving a thin market.',
    'On memecoins, watch for fake volume, where bots trade back and forth with themselves.',
    'Real volume comes from many different wallets.',
  ], 'Volume is the lie detector of a chart.'),

  V(39, 'rsi', 'What the RSI actually tells you', [
    'What the RSI actually tells you.',
    'The relative strength index measures how fast and how strongly the price has moved recently.',
    'Above seventy is often called overbought, below thirty oversold.',
    'But in a strong trend, it can stay overbought for a long time.',
    "It's a clue, not a signal. Never trade it alone.",
  ], 'RSI explained without the hype.'),

  V(40, 'narratives', 'Crypto moves in stories', [
    'Crypto moves in narratives.',
    'AI coins, gaming, meme seasons, new blockchains. Money rotates from one story to the next.',
    'Being early to a narrative can matter more than picking the perfect coin.',
    "Being late is expensive, because you're buying from the people who were early.",
    'Ask yourself: is this story just starting, or is everyone already talking about it?',
  ], 'Narratives drive crypto. Which one is next?'),

  V(41, 'pump-groups', 'Those "next 100x" groups', [
    'Those groups promising the next 100x? Here is how they work.',
    'The organizers buy early and quietly.',
    'Then they tell members to buy at the same time, and the price spikes.',
    'The organizers sell into that spike, and most members are left with losses.',
    "If you're not the one who bought first, you're the exit liquidity.",
  ], 'Pump groups exposed.'),

  V(42, 'exit-liquidity', "Don't be someone's exit liquidity", [
    "Never be someone's exit liquidity.",
    'To sell a big bag, a whale needs buyers. Lots of them.',
    'Hype, paid posts and fake urgency are how they find those buyers.',
    'When everyone is suddenly screaming about one coin, ask who is selling to you.',
    "Be curious when it's quiet. Be careful when it's loud.",
  ], 'Who is selling to you right now?'),

  V(43, 'gas-fees', 'Why did that trade cost so much?', [
    'Why did my transaction cost that much?',
    'Every blockchain transaction pays a fee to the network, often called gas.',
    'When the network is busy, fees go up.',
    'On some chains, a small memecoin trade can cost more in fees than the trade is worth.',
    'Always check the fee before you confirm, especially with small amounts.',
  ], 'Gas fees explained.'),

  V(44, 'cex-vs-dex', 'Centralized vs decentralized exchanges', [
    'Centralized versus decentralized exchanges.',
    'A centralized exchange is a company. You log in, they hold your coins, and you usually verify your identity.',
    'A decentralized exchange is a smart contract. You trade directly from your own wallet.',
    'Centralized is easier and has support. Decentralized gives you more control, but every mistake is on you.',
    'Most people start centralized, then learn self custody step by step.',
  ], 'CEX or DEX? Here is the difference.'),

  V(45, 'kyc', 'Why exchanges ask for your ID', [
    'Why do exchanges ask for your ID?',
    "It's called KYC. Know your customer.",
    'Regulated platforms have to verify who you are, to fight fraud and money laundering.',
    "It's annoying, but it's also a sign the platform follows rules.",
    "Just make sure you're on the real site before you upload anything.",
  ], 'KYC explained.'),

  V(46, 'taxes', 'Yes, even memecoins can be taxed', [
    'Crypto gains can be taxed. Yes, even memecoins.',
    'In many countries, selling, swapping or spending crypto can count as a taxable event.',
    'The rules differ a lot from country to country, and holding periods can matter.',
    'Track every trade from day one, or tax season becomes a nightmare.',
    'When in doubt, ask a tax advisor where you live.',
  ], 'Track your trades. Tax season is coming either way.'),

  V(47, 'trading-plan', 'Never enter a trade without these 3', [
    'Never enter a trade without these three things.',
    'One: your entry, and why.',
    "Two: where you're wrong, and you get out.",
    'Three: where you take profit.',
    "If you are unable to answer all three before you click buy, that is not trading. That is gambling.",
  ], 'Entry, exit, target. Every single time.'),

  V(48, 'risk-reward', 'How to win while being wrong', [
    'Risk reward is how some traders come out ahead while being wrong most of the time.',
    'If you risk one to make three, you can lose more trades than you win and still end up ahead.',
    'If you risk three to make one, you need to be right almost every time.',
    'Before a trade, compare the distance to your stop with the distance to your target.',
    "Good traders ask how much they can lose first.",
  ], 'Risk reward explained with simple numbers.'),

  V(49, 'overtrading', 'More trades does not mean more money', [
    'More trades does not mean more money.',
    'Every trade costs fees, slippage and mental energy.',
    'Bored trading is one of the fastest ways to drain an account.',
    "Some of the best days are the ones where you press nothing at all.",
    'Wait for your setup. Sitting on your hands is a skill.',
  ], 'Overtrading is a silent account killer.'),

  V(50, 'sleep-test', "If it keeps you up at night, it's too big", [
    "If a trade keeps you up at night, it's too big.",
    'Your position should be small enough that you can still think clearly.',
    'Fear and greed make you sell bottoms and buy tops.',
    'Cut the size until your heart rate stays normal.',
    'Calm traders last longer.',
  ], 'The sleep test for position size.'),

  V(51, 'market-never-sleeps', 'Crypto never sleeps. You should.', [
    'Crypto never sleeps. You should.',
    'The market trades 24/7, including weekends and holidays.',
    "Big moves often happen when most people are asleep.",
    'That is why alerts and pre set orders beat staring at charts all day.',
    "Protect your sleep, your health and your focus. That's your real edge.",
  ], 'Your health is your edge.'),

  V(52, 'money-buckets', 'Split your money into buckets', [
    'Split your money into buckets.',
    'An emergency fund you never touch.',
    "Long term money you never trade.",
    'And a small trading pot. Money you can afford to lose completely.',
    "If the trading pot hits zero, you stop and learn. You never refill it with rent money.",
  ], 'Three buckets. Never mix them.'),

  V(53, 'fake-hype', 'That hyped comment section is fake', [
    'That hyped comment section? A lot of it is fake.',
    'Projects can buy followers, bot replies and fake engagement.',
    'Check if accounts are brand new, repeat the same phrases, or only ever post about one coin.',
    'Real communities have real conversations, including criticism.',
    'Hype is cheap. Proof is expensive.',
  ], 'How to spot fake hype.'),

  V(54, 'survivors', 'What surviving traders have in common', [
    'What the traders who survive have in common.',
    'They size small, and they cut losers quickly.',
    "They take profits and never get attached.",
    'They keep learning and they review their mistakes.',
    "And they never bet money they need to live. It's boring. That's the point.",
  ], 'Survival first. Everything else second.'),

  V(55, 'winter-arc-finale', 'Day 55. The winter arc is done.', [
    'Day fifty five. The winter arc is done.',
    'You now know more about memecoins, risk and scams than most people who trade them.',
    "Remember: protect your money, size small, take profits, and never trust hype. Including mine.",
    'Knowledge compounds, just like money.',
    'See you in spring.',
  ], 'Day 55. Thank you for doing the winter arc with me.'),
];
