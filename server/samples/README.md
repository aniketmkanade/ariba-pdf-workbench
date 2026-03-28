# Invoice XSL-FO Stylesheet - Deliverables

## Project Overview
This project delivers a robust, enterprise-grade XSL-FO stylesheet for generating professional PDF invoices with advanced formatting, pagination, and conditional logic.

## Deliverables

### 1. **XSL-FO Stylesheet** (`templates/invoice.xsl`)
A comprehensive XSLT 1.1 stylesheet that transforms XML invoice data into XSL-FO format, processed by Apache FOP for PDF generation.

**File Size:** 14 KB  
**Format:** XML with XSL-FO namespace  
**Compatibility:** Apache FOP 2.11+, Standard XSL-FO 1.1

### 2. **Sample Input XML** (`inputs/invoice-sample.xml`)
A complete invoice data file demonstrating all features including:
- 18 line items with varying quantities and prices
- Missing price values (empty UnitPrice elements) for testing N/A handling
- Multiple items with quantities exceeding 100 units for yellow highlighting
- Complete invoice header with ID, date, and customer information

**File Size:** 3.2 KB  
**Format:** XML with InvoiceHeader and Items structure

### 3. **Generated PDF Output** (`outputs/invoice-output.pdf`)
Fully formatted, multi-page invoice PDF demonstrating all implemented features.

**File Size:** 12 KB  
**Pages:** 2 (demonstrates pagination and repeating headers)

---

## Key Features Implemented

### ✅ Repeating Table Headers
- Table headers automatically repeat on each page
- Implemented using XSL-FO `<fo:table-header>` group
- Blue header background (#e8f0f8) with dark blue text (#1a4d99)
- Consistent across all page breaks

### ✅ Quantity-Based Conditional Formatting
- **Highlight Rule:** Quantities > 100 display with yellow background (#ffff99)
- **Implementation:** Dynamic XPath variable in `xsl:for-each` loop
- **Test Data:** Lines 1, 3, 7, 8, 11, 13, 15 exceed 100 units
- **Visual Indicator:** Bold quantity display for emphasis

### ✅ Missing Price Handling
- **Display:** "N/A" in bold red text (color: red)
- **Application:** Both Unit Price and Line Total columns
- **Implementation:** Conditional XPath check: `$price != ''`
- **Test Data:** Lines 3, 6, 10, 18 have missing UnitPrice values
- **Calculation:** Line total skipped for missing prices; not included in subtotal

### ✅ Continuous Table Borders
- **Border Style:** 1pt solid #cccccc (light gray) on all cells
- **Row Borders:** Consistent 0.25in height with clear separation
- **Header Borders:** Enhanced with 1pt solid #1a4d99 (dark blue)
- **Implementation:** `border="1pt solid #cccccc"` on all `<fo:table-cell>` elements
- **Effect:** Professional, clean table appearance across page breaks

### ✅ Totals Row - Last Page Only
- **Location:** Appears after all data rows, guaranteed on last page
- **Components:**
  - Subtotal: Sum of all valid line totals
  - Tax: 10% calculated on subtotal
  - Grand Total (TOTAL DUE): Subtotal + Tax
- **Styling:** 
  - Subtotal/Tax: Light gray background (#f5f5f5)
  - Grand Total: Dark blue background (#1a4d99) with white text
  - All right-aligned for financial standard
- **Calculation Method:** Template-based recursive calculation to avoid XPath type errors

---

## Technical Specifications

### Page Layout
- **Page Format:** US Letter (8.5" × 11")
- **Margins:** 0.45" all sides
- **Header Region:** 0.75" (invoice info + separator line)
- **Body Region:** Dynamic with table content
- **Footer Region:** 0.5" (page numbering)

### Table Structure
- **Columns:** 5 columns with fixed widths
  1. Line # (0.8")
  2. Description (3.4")
  3. Quantity (1.0")
  4. Unit Price (1.1")
  5. Line Total (1.2")
- **Column Borders:** All columns have consistent 1pt borders
- **Data Rows:** 0.25" height for readability

### Font Configuration
- **Header Title:** 14pt bold, dark blue
- **Column Headers:** 10pt bold, dark blue on light blue background
- **Data Cells:** 9pt normal weight
- **Quantity:** 9pt bold
- **N/A Values:** 9pt bold red
- **Totals:** 9pt normal (subtotal/tax), 11pt bold (grand total)

### Colors Used
- **Primary:** #1a4d99 (Dark Blue) - Headers, borders, grand total
- **Secondary:** #e8f0f8 (Light Blue) - Header row background
- **Highlight:** #ffff99 (Yellow) - Qty > 100 rows
- **Alert:** Red - Missing prices
- **Neutral:** #f5f5f5 (Light Gray) - Subtotal/tax rows
- **Text:** #cccccc (Light Gray) - Cell borders, #666666 (Dark Gray) - Footer text

---

## Usage Instructions

### Generate PDF from Sample Data
```bash
cd /Users/aniketmkanade/Documents/PDF\ Customisation\ tool/server/samples
fop -xml inputs/invoice-sample.xml -xsl templates/invoice.xsl -pdf outputs/invoice-output.pdf
```

### Process Your Own Invoice Data
1. Create XML file in `inputs/` folder with same structure as `invoice-sample.xml`
2. Run FOP command with your XML file:
   ```bash
   fop -xml inputs/your-invoice.xml -xsl templates/invoice.xsl -pdf outputs/your-output.pdf
   ```

### Required XML Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <InvoiceHeader>
    <InvoiceID>INV-XXXX-XXX</InvoiceID>
    <Date>YYYY-MM-DD</Date>
    <CustomerName>Company Name</CustomerName>
  </InvoiceHeader>
  <Items>
    <Item>
      <LineNum>1</LineNum>
      <Description>Item description</Description>
      <Quantity>100</Quantity>
      <UnitPrice>1000.00</UnitPrice>
    </Item>
    <!-- More items... -->
  </Items>
</Invoice>
```

---

## Quality Assurance

### Features Verified in Output
- [✓] Table headers repeat on page 2
- [✓] Lines 1, 3, 7, 8, 11, 13, 15 display with yellow background (Qty > 100)
- [✓] Lines 3, 6, 10, 18 show "N/A" in red for missing prices
- [✓] Table borders remain continuous across page break
- [✓] Subtotal/Tax/Grand Total appear only on page 2 (last page)
- [✓] Page numbering displays correctly (Page 1 of 2, Page 2 of 2)
- [✓] Professional color scheme and formatting throughout
- [✓] Clean typography with proper font sizing

### Tested Scenarios
- ✓ Multi-page pagination (18 items over 2 pages)
- ✓ Missing price handling in calculations
- ✓ Quantity highlighting edge cases (=100, >100, <100)
- ✓ Border continuity across page breaks
- ✓ Header repetition verification
- ✓ Tax calculation accuracy (10% of subtotal)

---

## Standards Compliance

### XSL-FO Compliance
- **Standard:** XSL-FO 1.1 (W3C Recommendation)
- **Vendor Extensions:** None used (no vendor-specific properties)
- **Processor:** Apache FOP 2.11 (fully compatible)

### No Manual Header Duplication
- Headers are defined once in `<fo:table-header>` block
- Automatic repetition across pages via FOP's table handling
- No code duplication or hard-coded repeated sections

### XSLT Compatibility
- **Version:** XSLT 1.1
- **Parser:** Java/Xalan XSLT processor (strict type checking compatible)
- **Templates:** Recursive template structure for calculations
- **No Dynamic Functions:** All transformations use standard XPath/XSLT

---

## File Structure
```
server/samples/
├── inputs/
│   ├── invoice-sample.xml           [Sample data - 18 items]
│   ├── asn.xml                      [Other sample files]
│   ├── hu.xml
│   └── po.xml
├── templates/
│   └── invoice.xsl                  [XSL-FO stylesheet - 14 KB]
├── outputs/
│   └── invoice-output.pdf           [Generated PDF - 2 pages]
├── docs/                            [Documentation folder]
└── README.md                        [This file]
```

---

## Technical Notes

### Calculation Method
Due to Java XSLT processor type-checking restrictions, totals are calculated using a recursive template pattern rather than direct XPath sum operations. This ensures compatibility with strict XSLT processors.

### Page Break Handling
The table's `<fo:table-body>` structure ensures proper pagination:
- Headers repeat automatically via `<fo:table-header>`
- Body rows continue across pages
- Totals section intentionally placed after table to ensure last-page-only appearance

### Color Accessibility
- Highlight colors (yellow, blue) have sufficient contrast with text
- Red for alerts is standard in financial documents
- All text remains readable on both white and colored backgrounds

---

## Support & Modifications

### Common Customizations
1. **Change colors:** Update hex values in stylesheet (search `#1a4d99`, `#ffff99`, etc.)
2. **Adjust quantity threshold:** Change `> 100` to desired value in line 140
3. **Modify tax rate:** Change `0.10` to desired percentage in totals section
4. **Add/remove columns:** Edit column definitions and table-column elements
5. **Reorder data:** Rearrange Item elements within `xsl:for-each` loop

### File Paths
- Stylesheet: `/templates/invoice.xsl`
- Sample Input: `/inputs/invoice-sample.xml`
- PDF Output: `/outputs/invoice-output.pdf`
- This Guide: `/README.md`

---

## Version Information
- **XSL-FO Version:** 1.1
- **XSLT Version:** 1.1
- **Apache FOP Version:** 2.11
- **Created:** March 27, 2026
- **Invoice Sample Data:** 18 items, 2-page output

---

## Compliance Summary

✅ **Requirement:** Create table with repeating headers across page breaks  
✅ **Requirement:** Quantity > 100 highlighted with yellow background  
✅ **Requirement:** Missing prices displayed as N/A in red  
✅ **Requirement:** Table borders remain continuous across page breaks  
✅ **Requirement:** Totals row appears only on last page  
✅ **Restriction:** No vendor-specific extensions used  
✅ **Restriction:** No manual header duplication  

**All requirements and restrictions have been met.**

---

## License & Usage
This stylesheet is provided for enterprise invoice generation. Modify and distribute as needed for your organization's use.
