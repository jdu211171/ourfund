# Nest — Family Budget App · Feature List

## 🔐 Auth & Onboarding
- [ ] Onboarding splash / intro screens
  - [ ] Multi-step carousel with value props
  - [ ] Skip button to go straight to sign-up
  - [ ] Progress dots indicator
- [ ] Sign up with email & password
  - [ ] Email & password form with inline validation
  - [ ] Password strength indicator
  - [ ] Terms of service & privacy policy checkbox
- [ ] Log in with email & password
  - [ ] Persistent "Remember me" toggle
  - [ ] Show / hide password toggle
- [ ] Reset password via email
  - [ ] Enter email screen → send reset link
  - [ ] "Check your inbox" confirmation screen
  - [ ] Deep-link back into app to set new password
- [ ] Passcode lock (PIN screen)
  - [ ] Set a 4- or 6-digit PIN
  - [ ] Biometric unlock (Face ID / Touch ID)
  - [ ] Forgot PIN → re-authenticate via password
- [ ] Create a new household (family group)
  - [ ] Name the household
  - [ ] Pick a household avatar / emoji
  - [ ] Set default currency
- [ ] Join an existing household via invite code
  - [ ] Manual code entry
  - [ ] QR code scan
  - [ ] Deep-link auto-fill from invite URL
- [ ] Confirm invite before joining
  - [ ] Preview household name & members
  - [ ] Accept / decline buttons
- [ ] Handle invalid / expired invite codes
  - [ ] Friendly error screen with retry option
  - [ ] Option to request a new code from admin

## 🏠 Home
- [ ] Dashboard with total balance header
  - [ ] Animated balance counter on load
  - [ ] Toggle to show / hide balance (privacy mode)
  - [ ] Switch between personal & shared balance view
- [ ] Quick-add buttons (expense, income, transfer)
  - [ ] Floating action button (FAB) with expand animation
  - [ ] Haptic feedback on tap
- [ ] Recent transactions list
  - [ ] Show last 10 transactions
  - [ ] Swipe-to-delete with undo toast
  - [ ] Tap to open transaction detail
- [ ] Savings goals summary
  - [ ] Horizontal scroll card per goal
  - [ ] Progress bar with % label
  - [ ] Tap to open goal detail
- [ ] Budget mode toggle (personal ↔ shared)
  - [ ] Animated pill toggle in header
  - [ ] Persist last-used mode
- [ ] Bottom navigation bar
  - [ ] Active tab indicator animation
  - [ ] Badge for unread notifications

## 💸 Transactions
- [ ] Add expense (amount, category, wallet, note, date)
  - [ ] Numeric keypad with decimal support
  - [ ] Category picker with icons
  - [ ] Wallet picker dropdown
  - [ ] Optional photo attachment (receipt)
  - [ ] Date-time picker (defaults to now)
  - [ ] Split expense across multiple people
- [ ] Add income (amount, source, wallet, note, date)
  - [ ] Source picker (salary, freelance, gift, other)
  - [ ] Recurring income flag
- [ ] Transfer funds between wallets
  - [ ] From / To wallet selector
  - [ ] Amount & optional note
  - [ ] Confirm transfer screen
- [ ] View expense detail
  - [ ] Full breakdown of all fields
  - [ ] View attached receipt image
  - [ ] See who in the household added it
- [ ] View income detail
  - [ ] Full breakdown of all fields
- [ ] Edit an existing expense
  - [ ] Pre-filled form with existing values
  - [ ] Change any field and save
- [ ] Delete a transaction (with confirmation)
  - [ ] Bottom-sheet confirmation dialog
  - [ ] Undo option via snackbar (5 s)
- [ ] View receipt for a transaction
  - [ ] Full-screen image viewer with zoom
  - [ ] Share / export button
- [ ] Scan a physical receipt (camera / image upload)
  - [ ] Camera capture with edge detection overlay
  - [ ] Gallery upload fallback
  - [ ] OCR auto-fill amount & merchant name
- [ ] Full transaction history with search
  - [ ] Debounced search-as-you-type
  - [ ] Highlight matching text in results
- [ ] Filter & sort transactions (by date, category, amount, wallet)
  - [ ] Multi-select category filter chips
  - [ ] Date range picker
  - [ ] Sort by newest / oldest / highest / lowest
  - [ ] Active filter count badge on filter icon

## 💰 Wallets
- [ ] View all wallets and balances
  - [ ] Card-per-wallet with icon, name, balance
  - [ ] Total across all wallets in header
  - [ ] Tap to view wallet transactions
- [ ] Create a new wallet (name, icon, currency)
  - [ ] Name input
  - [ ] Icon / emoji picker
  - [ ] Currency selector (ISO list)
  - [ ] Initial balance input
- [ ] Edit a wallet (name, icon)
  - [ ] Pre-filled form
  - [ ] Archive / deactivate option
- [ ] Connect a bank account (Plaid integration)
  - [ ] "Link Bank" entry point in wallet list
  - [ ] Plaid Link SDK flow (institution search → login)
  - [ ] Select which accounts to import
- [ ] Plaid connecting / syncing loading state
  - [ ] Skeleton loader cards
  - [ ] Sync progress indicator
- [ ] Plaid connected success confirmation
  - [ ] Success animation
  - [ ] Show imported accounts & balances

## 🗂️ Categories
- [ ] View and manage spending categories
  - [ ] Grid of icon + color tiles
  - [ ] Drag-to-reorder
  - [ ] Toggle category visibility
- [ ] Add a custom category (name, icon, color)
  - [ ] Name input
  - [ ] Icon picker (emoji or SF Symbol)
  - [ ] Color swatch picker
- [ ] Edit / reorder existing categories
  - [ ] Inline rename
  - [ ] Drag handle for reorder
  - [ ] Delete with merge-into option

## 🎯 Goals
- [ ] Create a savings goal (name, target amount, deadline)
  - [ ] Goal name & emoji picker
  - [ ] Target amount input
  - [ ] Optional deadline date picker
  - [ ] Assign to a specific wallet
- [ ] View goal detail and progress
  - [ ] Animated circular or linear progress bar
  - [ ] History of contributions
  - [ ] Days remaining countdown
- [ ] Contribute to / withdraw from a goal
  - [ ] Amount input
  - [ ] Select source wallet
  - [ ] Confirmation screen
- [ ] Goal achieved celebration screen
  - [ ] Confetti animation
  - [ ] Share achievement card (social share)
  - [ ] Archive or delete goal option

## 🔁 Recurring Items
- [ ] View and manage subscriptions
  - [ ] List with next-billing date & amount
  - [ ] Swipe to pause / cancel
  - [ ] Upcoming billing timeline view
- [ ] View and manage recurring income
  - [ ] List with next-deposit date & amount
  - [ ] Mark as received manually
- [ ] Add a recurring item
  - [ ] Frequency picker (daily / weekly / monthly / custom)
  - [ ] Start date & optional end date
  - [ ] Link to category & wallet
- [ ] Recurring item reminder notifications
  - [ ] Configurable reminder lead time (1 day, 3 days, etc.)

## 📊 Reports & Analytics
- [ ] Weekly spending report
  - [ ] Bar chart of spending by day
  - [ ] Top 3 categories this week
  - [ ] Week-over-week comparison
- [ ] Monthly spending report
  - [ ] Donut chart by category
  - [ ] Month-over-month comparison sparkline
  - [ ] Biggest single expense callout
- [ ] Yearly spending report
  - [ ] Line chart of monthly totals
  - [ ] Year-over-year summary
- [ ] Analytics dashboard (charts, trends, top categories)
  - [ ] Interactive tap-to-drill-down charts
  - [ ] Date range selector
  - [ ] Export report as PDF / CSV

## 🔔 Alerts & Notifications
- [ ] In-app notifications / alerts list
  - [ ] Grouped by date (Today, Yesterday, Older)
  - [ ] Swipe to dismiss
  - [ ] Mark all as read button
- [ ] Notification preferences (toggle per category)
  - [ ] Toggle for: large transactions, budget exceeded, goal milestone, recurring item due, invite received
  - [ ] Quiet hours setting (do-not-disturb window)
- [ ] Budget-exceeded alert
  - [ ] Threshold % config (e.g., alert at 80 %)
  - [ ] In-app banner + push notification
- [ ] Low balance alert
  - [ ] Per-wallet minimum balance threshold

## 👨‍👩‍👧 Family / Household
- [ ] Family profile screen (all members)
  - [ ] Avatar grid with name & role badge
  - [ ] Tap member to view their activity
- [ ] Invite a new member
  - [ ] By email — send invitation email with join link
  - [ ] By one-time invite link — generate a single-use URL (expires in 24 h)
  - [ ] By QR code — display QR in-app for in-person scanning
  - [ ] Copy link to clipboard with one tap
  - [ ] Resend or revoke a pending invite
- [ ] Set per-member permissions (view, edit, admin)
  - [ ] Role picker: Viewer / Editor / Admin
  - [ ] Permission detail tooltip per role
  - [ ] Admin-only: change other members' roles
- [ ] Set a member's spending allowance
  - [ ] Weekly or monthly cap input
  - [ ] Alert when member approaches / exceeds cap
- [ ] Remove a member from the household
  - [ ] Confirmation dialog
  - [ ] Option to reassign their transactions before removal

## 💳 Lend & Borrow
- [ ] Log money lent to someone
  - [ ] Borrower name (contact picker or manual)
  - [ ] Amount, note, due date
  - [ ] Deduct from chosen wallet
- [ ] Log money borrowed from someone
  - [ ] Lender name, amount, note, due date
  - [ ] Track which wallet received funds
- [ ] Track outstanding lend/borrow balances
  - [ ] Separate tabs: Lent / Borrowed
  - [ ] Overdue indicator (past due date)
  - [ ] Mark as settled with confirmation
  - [ ] Send reminder to borrower (SMS / copy link)

## 🛍️ Product Tracker
- [ ] Add a product / price to watch
  - [ ] Product name & URL input
  - [ ] Target price threshold input
  - [ ] Store / retailer label
- [ ] View tracked products and their prices
  - [ ] Current price vs. target price
  - [ ] Price history sparkline
  - [ ] "Price dropped!" badge when threshold met
  - [ ] Remove a tracked product

## ⚙️ Settings & Profile
- [ ] Edit profile (name, avatar, email)
  - [ ] Avatar: pick from library, take photo, or upload
  - [ ] Display name & email update
  - [ ] Change password from within settings
- [ ] Change display currency
  - [ ] Searchable ISO currency list
  - [ ] Live preview of converted balances
- [ ] App settings (theme, language, etc.)
  - [ ] Light / Dark / System theme toggle
  - [ ] Language picker (i18n)
  - [ ] Date format preference
  - [ ] First day of week setting
- [ ] Account danger zone
  - [ ] Sign out (all devices)
  - [ ] Delete account with data-wipe confirmation

## 🧩 Edge States
- [ ] Empty history / no transactions state
  - [ ] Illustrated empty-state graphic
  - [ ] CTA to add first transaction
- [ ] No results after filter/search state
  - [ ] "No results" illustration
  - [ ] Clear-filters button
- [ ] Auth loading / splash state
  - [ ] Branded animated splash logo
  - [ ] Skeleton loaders on dashboard
- [ ] Offline / no-internet state
  - [ ] Banner indicating offline mode
  - [ ] Read-only access to cached data
  - [ ] Auto-retry with status indicator on reconnect
- [ ] Error / server failure state
  - [ ] Friendly error message with retry button
  - [ ] Report-a-bug shortcut
