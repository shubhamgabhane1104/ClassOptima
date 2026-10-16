@'
# ClassOptima Timetable UI Architecture

## Overview

The Timetable UI displays a weekly academic schedule in a visual matrix. It separates timetable layout, individual lecture cards, class-detail inspection, cohort selection, and theme styling into dedicated components and stylesheets.

## Component Architecture

### 1. TimetableGrid

**File:** `src/components/timetable/TimetableGrid.jsx`

- Renders the timetable as a table.
- Displays weekdays from Monday to Friday.
- Shows period headers and a lunch recess column.
- Reads scheduled classes from the `schedule` prop.
- Renders a `LectureCard` for each occupied slot.
- Supports click handling through the `onSlotClick` prop.
- Supports laboratory sessions spanning two consecutive periods when the slot data indicates a two-period lab.

### 2. LectureCard

**File:** `src/components/timetable/LectureCard.jsx`

- Displays an individual scheduled class inside the timetable.
- Receives class information through the `slot` prop.
- Supports click handling through the `onClick` prop.
- Uses shared timetable CSS for card presentation.

### 3. SlotModal

**File:** `src/components/timetable/SlotModal.jsx`

- Displays details for a selected class.
- Shows the subject, class type, teacher, and room when available.
- Displays day and time when those values are provided.
- Supports closing through the close button, overlay click, or Escape key.
- Uses `src/styles/modal.css` for modal styling.

### 4. TimetableToolbar

**File:** `src/components/timetable/TimetableToolbar.jsx`

- Provides a cohort selector.
- Includes Sem 5 Div A, Sem 5 Div B, Sem 6 Div A, and Sem 6 Div B options.
- Calls the `onSelectSection` callback when the selected cohort changes.

## Styling Architecture

### Timetable Styles

**File:** `src/styles/timetable.css`

Defines the timetable container, matrix, period headers, day cells, lecture cards, and Theory badge styling. It also contains the clash-pulse animation styles and reduced-motion handling.

### Modal Styles

**File:** `src/styles/modal.css`

Defines the slot-inspection modal, overlay, header, detail fields, badges, responsive styling, and reduced-motion behavior.

### Theme Styles

**File:** `src/styles/theme.css`

Defines the default dark appearance and light-mode overrides for the timetable, table headers, day cells, lecture cards, and card titles. The light theme is activated through the `light-mode` class on the body element.

## Data and Interaction Flow

1. The parent component supplies timetable data through the `schedule` prop.
2. `TimetableGrid` iterates over weekdays and periods.
3. Occupied periods render `LectureCard` components.
4. The slot-click callback can be used by the parent component to select a class and display `SlotModal`.
5. `TimetableToolbar` reports cohort changes through `onSelectSection`.

## Layout and Visual Design

- The timetable uses a CSS table matrix with a minimum width of 900 pixels.
- Day labels and period headers distinguish the schedule's rows and columns.
- Theory and laboratory sessions can be represented using class-type badges.
- Laboratory sessions can span two consecutive periods when their data specifies a duration of two periods.
- Clash styling is defined through the `has-clash` CSS class.
- Reduced-motion preferences disable the clash-pulse animation.

## Important Integration Notes

- The parent component is responsible for connecting toolbar selection to the appropriate cohort schedule.
- The parent component is also responsible for connecting slot selection to modal state.
- Theme styles must be imported into the application for their rules to apply.
- The `light-mode` class must be added to the body element to activate the light theme.
- Clash highlighting requires the relevant lecture card to receive the `has-clash` class.

## Main Files

- `src/components/timetable/TimetableGrid.jsx`
- `src/components/timetable/LectureCard.jsx`
- `src/components/timetable/SlotModal.jsx`
- `src/components/timetable/TimetableToolbar.jsx`
- `src/styles/timetable.css`
- `src/styles/modal.css`
- `src/styles/theme.css`
'@ | Set-Content -Path docs/TIMETABLE_UI.md -Encoding utf8