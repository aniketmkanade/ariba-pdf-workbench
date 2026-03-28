# 📘 Ariba PDF Extension: Step-by-Step User Guide (Updated)

Welcome! The project is now organized into clear categories to make it even easier to use.

---

## 1. Starting the Extension
1.  **Open VSCode** and ensure you have the "PDF Customisation tool" folder open.
2.  **Press `F5`** to launch the "Extension Development Host".

## 2. Choosing Your Data (Inputs)
1.  Click the **Ariba PDF icon** on the far left Activity Bar.
2.  You will see your data files in the **Sample Data Explorer**. These are stored in `samples/inputs/`.
3.  **Click any file** (like `invoice-sample.xml`) to load it.

*   **Upload**: Click the **Add (+)** button in the sidebar to move your own XML files into the `inputs/` folder.

## 3. Editing Templates
1.  Open your XSLT file from the **`samples/templates/`** folder.
2.  Position your preview (**Cmd+Shift+P** > **Ariba: Open Live PDF Preview**).
3.  Editing the code will update the preview instantly.

## 4. Using @ariba AI
1.  Open the **VSCode Chat** and type **`@ariba`**.
2.  Ask for changes like: *"@ariba make the table header dark blue"*.
3.  Click **"Apply Suggested Changes"** to update your template.

## 5. Finalizing Your Work (Zero Clutter) ✅
1.  When you are happy with the preview, click the **Checkmark icon** (Finalize & Clear Task).
2.  Select a folder on your computer.
3.  The extension will save **BOTH** your `template.xsl` and your `final_document.pdf` there.
4.  **Auto-Cleanup**: The extension will then **automatically wipe** the temporary files from the workspace so you are ready for your next task.

*   **Manual Clear**: Click the **Trash Icon** in the Ariba sidebar if you want to start fresh without saving.

---
*Privacy: 100% Local processing via Ollama.*
