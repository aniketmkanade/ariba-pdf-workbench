# 🤖 AI Prompting Guide for Ariba PDF Workbench

To get the absolute best results from the local AI generator, follow these 4 golden rules when describing your layout changes:

### 1. 🎯 Use Exact XML Tag Names
The AI maps variables by name. Being specific guarantees a perfect match:
- ❌ **Don't say:** *"Add the tracking info to the header."*
- ✅ **Do say:** *"Add the `<TrackingNumber>` and `<Carrier>` to the top right of the shipment header."*

### 2. 🪜 The Rule of "One Step at a Time"
Local AI models perform best when given small, iterative tasks rather than massive lists.
- ❌ **Don't say:** *"Redesign the whole document into a magazine layout, add 5 new columns, and delete the footer."*
- ✅ **Do say:** *"First, change the table header background to `#003366` and text to white."* (Wait for generation) -> *"Great, now add a new column for `<TaxAmount>`."*

### 3. 🧠 Lean on Chat Memory
The extension remembers your previous messages in the current session. If the AI makes a mistake, don't re-type your entire prompt! Correct it like a human colleague:
- *"Wait, that made the table too wide, make the first column smaller."*
- *"Actually, remove that bold styling."*

### 4. 🗺️ Name the Visual Zones
Because XSL-FO is highly layout-driven, tell the AI exactly *where* to put things:
- *"Place this in the `<fo:page-sequence>` footer"*
- *"Insert a new row inside the table body"*
- *"Align this block to the right margin"*

> **Note:** The AI is strictly programmed NOT to hallucinate or modify your actual XML data. If you want to test how pagination works, simply ask the AI to "write a dynamic loop for `<LineItem>`" and add actual mock items to your data file yourself!
