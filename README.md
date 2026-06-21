# CaloMacro: Calorie Tracker & Macro Dashboard

CaloMacro is a modern, high-fidelity health-tracking prototype designed as a user's daily food journal. The application is built using **Next.js App Router (TypeScript + Vanilla CSS)** with a clean architecture where all business logic, calorie/macro computations, data scaling, and state validations are implemented strictly on the **server side**.

---

## 🏗️ Architectural Overview

The application is structured into a presentation layer (Frontend) and a computational engine layer (Backend API), ensuring a separation of concerns:

```mermaid
graph TD
    subgraph Client-Side (Presentation)
        UI[React Dashboard - page.tsx]
        Form[Logging Card Inputs]
        Bar[Calorie Progress Bar]
        Meters[Macronutrient Meters]
        Scanner[Simulated AI Scanner]
        Modal[Exceeded Warning Modal]
    end

    subgraph Server-Side (Computation)
        StateAPI[api/state/route.ts]
        MealsAPI[api/meals/route.ts]
        ScanAPI[api/mock-scan/route.ts]
        Store[lib/stateStore.ts - Global Store]
        DB[(Food Database & Targets)]
    end

    UI -->|GET Fetch State| StateAPI
    Form -->|POST Log Meal| MealsAPI
    UI -->|POST Select Goal| StateAPI
    Scanner -->|GET Mock Food| ScanAPI
    StateAPI --> Store
    MealsAPI --> Store
    ScanAPI --> Store
    Store --> DB
    Store -->|Return Dashboard State| UI
```

### 📁 Directory Layout
- `src/types/index.ts` - TypeScript interfaces ensuring type safety across client and server.
- `src/lib/stateStore.ts` - Core backend engine managing target metrics, baseline food database, global in-memory state persistence, and nutrient calculations.
- `src/app/api/` - Next.js Route Handlers (REST Endpoints) wrapping state store operations.
- `src/app/globals.css` - Custom Vanilla CSS stylesheet implementing dark modes, linear gradient progress bars, glassmorphism shadows/blurs, scanning animations, and modal overlays.
- `src/app/page.tsx` - Client Dashboard managing input hooks, scanner delays, warning dialog visibility, and rendering the latest state from the API.

---

## ⚙️ Core Backend Logic & Computations

All computations occur on the server side to maintain logic integrity and scalability:

### 1. Nutrient Scaling Algorithm
When logging a meal (e.g. `200g` of `Chicken Breast`), the server looks up the food item in its catalog (which holds values per **100g**):
- **Chicken Breast**: `165 kcal, 31g protein, 0g carbs, 3.6g fat` per 100g.
- **Scaling Math**:
  $$\text{Calories} = \text{round}\left(\frac{\text{base kcal} \times \text{weight}}{100}\right) = \text{round}\left(\frac{165 \times 200}{100}\right) = 330 \text{ kcal}$$
  $$\text{Macros} = \text{round}\left(\frac{\text{base macro} \times \text{weight}}{100}\right)$$
- If the item name is not explicitly recognized, the server matches it using fuzzy/substring rules, or defaults to a standard fallback profile (`120 kcal, 5g protein, 15g carbs, 3g fat` per 100g) as a custom food placeholder.

### 2. Budget Tracking State
The server calculates running aggregates on all active meals, computes remaining targets, and yields an `exceeded: boolean` flag.
If `totals.calories > targets.calories`, the flag is set to `true`. This causes the client-side progress bar to change to **Crimson Red** with a pulsing glow, and triggers the **Daily Budget Exceeded!** warning modal.

### 3. Fitness Goal Toggle
Users can select between three goals, which dynamically shifts target limits on the server without clearing the user's current meals:
*   **Weight Loss**: `1600 kcal` | Protein: `120g` | Carbs: `150g` | Fats: `50g`
*   **Maintenance**: `2200 kcal` | Protein: `140g` | Carbs: `250g` | Fats: `70g`
*   **Muscle Gain**: `2800 kcal` | Protein: `180g` | Carbs: `320g` | Fats: `90g`

Changing goals immediately recalculates target percentages and exceeded flags in real time.

---

## 🎨 Frontend UI & Interaction Design

The frontend strictly manages presentation and triggers state requests:
*   **AI Photo Scanner**: Clicking the scanner initiates a visual scanning light overlay. The client enforces a realistic `1.2-second` scan delay to simulate image analysis before querying `/api/mock-scan` and autofilling the form inputs.
*   **Exceeded Modal**: Shows a warnings dialog prompting the user when they overeat. A transition handler ensures it only pops up when the threshold is *first* crossed.
*   **History Grid**: Renders meals in real-time. Clicking the trash button makes a `DELETE` request, updating the backend state and instantly reducing the progress meters.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (version 18 or later) installed.

### Setup and Installation
1. Install project dependencies:
   ```bash
   npm install
   ```

2. Run the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) on your browser.

3. To build and test production compiles:
   ```bash
   # Build the bundle with webpack
   npx next build --webpack
   
   # Start the production server
   npm run start
   ```
