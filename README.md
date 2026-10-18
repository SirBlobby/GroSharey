<p align="center">
  <img src="frontend/public/grosharey-logo.png" alt="groSharey logo" width="140" />
</p>

<h1 align="center">groSharey</h1>

<p align="center"><strong>Split groceries, not friendships.</strong></p>

<p align="center">
  <a href="https://grosharey-frontend.vercel.app/"><img alt="Live demo" src="https://img.shields.io/badge/demo-live-47a152?style=for-the-badge&logo=vercel&logoColor=white" /></a>
  <img alt="Web, iOS, and Android" src="https://img.shields.io/badge/platforms-web%20%7C%20iOS%20%7C%20Android-1a1856?style=for-the-badge" />
</p>

<p align="center">
  <img alt="Expo" src="https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Python" src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img alt="Flask" src="https://img.shields.io/badge/Flask-000000?style=flat-square&logo=flask&logoColor=white" />
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img alt="Google Gemini" src="https://img.shields.io/badge/Google%20Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white" />
  <img alt="ElevenLabs" src="https://img.shields.io/badge/ElevenLabs-000000?style=flat-square&logo=elevenlabs&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" />
  <img alt="Bun" src="https://img.shields.io/badge/Bun-000000?style=flat-square&logo=bun&logoColor=white" />
</p>

---

Living with roommates means shared groceries, and shared groceries mean someone always ends up doing receipt math. groSharey keeps one shopping list for the whole apartment, reads your receipt with AI, hands each item to whoever asked for it, and tells everyone exactly what they owe.

## How it works

1. **Make a shared list.** Start a group with your roommates and add what everyone needs. Each item remembers who asked for it.
2. **Scan the receipt.** Snap a photo and groSharey reads every item, discount, and tax marker. Pick your group and AI assigns each item to the person who wanted it, then crosses it off the list.
3. **Settle up.** Everyone sees what they owe. Pay with one tap on Venmo or PayPal, nudge anyone who forgets, and your roommate confirms they got it.

## Features

### Shopping together
- **Groups and shared lists** with a store and notes on every item, plus personal lists for yourself
- **AI item matching** that knows "GV 2% MLK" is the milk Sam asked for
- **Shared pantry** where bought items land, and "running low" puts them back on the list
- **Shopping trips** so "I'm going to Trader Joe's" gives everyone a heads up to add last-minute items
- **Offline lists** in the mobile app, so crossing items off works even with bad signal in the store

### Splitting and paying
- **Smart receipt scanning** that expands store abbreviations and flags totals that don't add up
- **Penny-exact splits** where tax lands only on taxed items and leftover cents are shared fairly
- **Partial payments and overpaying**, with credit kept for the next run
- **Payment confirmation** so a payment only counts once the person who got paid confirms it
- **Payment reminders** with one tap, sent in the app and by email, at most once a day per friend so nobody gets spammed
- **Item disputes** for anything you didn't actually get
- **Group budgets** with a progress bar and alerts before you go over
- **Monthly PDF reports** for reimbursements

### Talk to it
- **Voice assistant** powered by Gemini and ElevenLabs that can run almost the whole app. Try:
  - "Add eggs and two bags of chips for Sam to the apartment list"
  - "We're running low on coffee" or "we used up the milk"
  - "I'm heading to Costco"
  - "Set our budget to $300 a month"
  - "Who owes me money?" or "remind Sam to pay me"
  - "I never got the olive oil from the Costco run"

  It asks before anything risky, like deleting a list or recording a payment, and answers out loud. You can also type.

### Friends and accounts
- **Add roommates by QR code** with the in-app scanner, or by username or email
- **Notifications and branded emails** when you're added to a split, someone buys your item, a friend pays you back, or someone sends a reminder
- **Split history** with the receipt photo for every grocery run
- **Audit log** of everything that happened on your account
- **Built for everyone** with dark mode, high contrast, text sizes, reduce motion, and color blindness friendly palettes

## Built with

| Part | Tools |
|------|-------|
| App | Expo and React with TypeScript, one codebase for web, iOS, and Android |
| Server | Python and Flask |
| Database | MongoDB Atlas |
| AI | Google Gemini for receipts, item matching, and the voice assistant |
| Voice | ElevenLabs for speech to text and spoken replies |
| Hosting | Vercel |

## Try it

The web app is live at **[grosharey-frontend.vercel.app](https://grosharey-frontend.vercel.app/)**.

To run it yourself, install [Bun](https://bun.sh/) and [uv](https://docs.astral.sh/uv/), then:

```bash
bun run setup
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
bun run dev
```

Fill in `backend/.env` with a MongoDB connection string and a free [Gemini API key](https://aistudio.google.com/apikey). An [ElevenLabs](https://elevenlabs.io/) key is optional and gives the voice assistant its voice. To try it on your phone, run `bun run dev:mobile` and scan the QR code with Expo Go.
