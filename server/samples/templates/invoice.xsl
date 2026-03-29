<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">
  
  <!-- Output format -->
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>
  
  <!-- Template to calculate invoice total -->
  <xsl:template name="calculate-total">
    <xsl:variable name="total" select="0"/>
    <xsl:call-template name="sum-items">
      <xsl:with-param name="items" select="Items/Item[UnitPrice != '']"/>
      <xsl:with-param name="index" select="1"/>
      <xsl:with-param name="total" select="0"/>
    </xsl:call-template>
  </xsl:template>

  <!-- Recursive template to sum item totals -->
  <xsl:template name="sum-items">
    <xsl:param name="items"/>
    <xsl:param name="index"/>
    <xsl:param name="total"/>
    
    <xsl:choose>
      <xsl:when test="$index > count($items)">
        <xsl:value-of select="$total"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="sum-items">
          <xsl:with-param name="items" select="$items"/>
          <xsl:with-param name="index" select="$index + 1"/>
          <xsl:with-param name="total" select="$total + ($items[$index]/Quantity * $items[$index]/UnitPrice)"/>
        </xsl:call-template>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- Root template -->
  <xsl:template match="/Invoice">
    <xsl:variable name="pageMaster">
      <xsl:choose>
        <xsl:when test="count(Items/Item) > 15">landscape</xsl:when>
        <xsl:otherwise>portrait</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">
      <!-- Define page layout -->
      <fo:layout-master-set>
        <!-- Portrait page master -->
        <fo:simple-page-master master-name="portrait" page-height="11in" page-width="8.5in"
                               margin-top="0.45in" margin-bottom="0.5in" 
                               margin-left="0.45in" margin-right="0.45in">
          <fo:region-body margin-top="0.85in" margin-bottom="0.6in"/>
          <fo:region-before extent="0.75in" region-name="xsl-region-before"/>
          <fo:region-after extent="0.5in" region-name="xsl-region-after"/>
        </fo:simple-page-master>
        <!-- Landscape page master -->
        <fo:simple-page-master master-name="landscape" page-height="8.5in" page-width="11in"
                               margin-top="0.45in" margin-bottom="0.5in" 
                               margin-left="0.45in" margin-right="0.45in">
          <fo:region-body margin-top="0.85in" margin-bottom="0.6in"/>
          <fo:region-before extent="0.75in" region-name="xsl-region-before"/>
          <fo:region-after extent="0.5in" region-name="xsl-region-after"/>
        </fo:simple-page-master>
      </fo:layout-master-set>
      
      <!-- Page sequence -->
      <fo:page-sequence master-reference="{$pageMaster}">
        <fo:static-content flow-name="xsl-region-before">
          <fo:block font-size="14pt" font-weight="bold" margin-bottom="3pt" color="#1a4d99">
            INVOICE
          </fo:block>
          <fo:table width="100%" border-collapse="collapse">
            <fo:table-column column-width="50%"/>
            <fo:table-column column-width="50%"/>
            <fo:table-body>
              <fo:table-row>
                <fo:table-cell padding="1pt">
                  <fo:block font-size="8pt" font-weight="bold">Invoice ID:</fo:block>
                  <fo:block font-size="8pt"><xsl:value-of select="InvoiceHeader/InvoiceID"/></fo:block>
                </fo:table-cell>
                <fo:table-cell padding="1pt">
                  <fo:block font-size="8pt" font-weight="bold">Customer:</fo:block>
                  <fo:block font-size="8pt"><xsl:value-of select="InvoiceHeader/CustomerName"/></fo:block>
                </fo:table-cell>
              </fo:table-row>
              <fo:table-row>
                <fo:table-cell padding="1pt">
                  <fo:block font-size="8pt" font-weight="bold">Date:</fo:block>
                  <fo:block font-size="8pt"><xsl:value-of select="InvoiceHeader/Date"/></fo:block>
                </fo:table-cell>
                <fo:table-cell padding="1pt">
                  <fo:block font-size="8pt">&#160;</fo:block>
                </fo:table-cell>
              </fo:table-row>
            </fo:table-body>
          </fo:table>
          <fo:block margin-top="2pt" height="0pt" border-bottom="1.5pt solid #1a4d99"/>
        </fo:static-content>

        <!-- Page footer with page number -->
        <fo:static-content flow-name="xsl-region-after">
          <fo:block text-align="center" font-size="9pt" color="#666666">
            Page <fo:page-number/> of <fo:page-number-citation ref-id="end-of-doc"/>
          </fo:block>
        </fo:static-content>

        <!-- Main content -->
        <fo:flow flow-name="xsl-region-body">
          
          <!-- Items table with repeating header -->
          <fo:table width="100%" border-collapse="collapse" 
                    border-spacing="0pt" table-layout="fixed">
            
            <!-- Column definitions -->
            <fo:table-column column-width="0.8in" border="1pt solid #cccccc"/>
            <fo:table-column column-width="3.4in" border="1pt solid #cccccc"/>
            <fo:table-column column-width="1.0in" border="1pt solid #cccccc"/>
            <fo:table-column column-width="1.1in" border="1pt solid #cccccc"/>
            <fo:table-column column-width="1.2in" border="1pt solid #cccccc"/>
            
            <!-- Table header (repeats on each page) -->
            <fo:table-header background-color="#e8f0f8" border="1pt solid #1a4d99">
              <fo:table-row height="0.3in">
                <fo:table-cell border="1pt solid #1a4d99" padding="4pt" 
                               display-align="center" text-align="center">
                  <fo:block font-weight="bold" font-size="10pt" color="#1a4d99">Line #</fo:block>
                </fo:table-cell>
                <fo:table-cell border="1pt solid #1a4d99" padding="4pt" 
                               display-align="center" text-align="left">
                  <fo:block font-weight="bold" font-size="10pt" color="#1a4d99">Description</fo:block>
                </fo:table-cell>
                <fo:table-cell border="1pt solid #1a4d99" padding="4pt" 
                               display-align="center" text-align="center">
                  <fo:block font-weight="bold" font-size="10pt" color="#1a4d99">Quantity</fo:block>
                </fo:table-cell>
                <fo:table-cell border="1pt solid #1a4d99" padding="4pt" 
                               display-align="center" text-align="right">
                  <fo:block font-weight="bold" font-size="10pt" color="#1a4d99">Unit Price</fo:block>
                </fo:table-cell>
                <fo:table-cell border="1pt solid #1a4d99" padding="4pt" 
                               display-align="center" text-align="right">
                  <fo:block font-weight="bold" font-size="10pt" color="#1a4d99">Line Total</fo:block>
                </fo:table-cell>
              </fo:table-row>
            </fo:table-header>

            <!-- Table body with data rows -->
            <fo:table-body border="1pt solid #cccccc">
              <xsl:for-each select="Items/Item">
                <!-- Determine if quantity exceeds 100 for highlighting -->
                <xsl:variable name="qty" select="Quantity"/>
                <xsl:variable name="price" select="UnitPrice"/>
                <xsl:variable name="totalPrice">
                  <xsl:choose>
                    <xsl:when test="$price != ''">
                      <xsl:value-of select="format-number($qty * $price, '$#,##0.00')"/>
                    </xsl:when>
                    <xsl:otherwise>N/A</xsl:otherwise>
                  </xsl:choose>
                </xsl:variable>
                
                <!-- Row with conditional background color for high quantity -->
                <xsl:variable name="bgColor">
                  <xsl:choose>
                    <xsl:when test="$qty > 100">#ffff99</xsl:when>
                    <xsl:otherwise>#ffffff</xsl:otherwise>
                  </xsl:choose>
                </xsl:variable>
                
                <fo:table-row background-color="{$bgColor}" height="0.25in">
                  <!-- Line Number -->
                  <fo:table-cell border="1pt solid #cccccc" padding="4pt" 
                                 display-align="center" text-align="center">
                    <fo:block font-size="9pt"><xsl:value-of select="LineNum"/></fo:block>
                  </fo:table-cell>
                  
                  <!-- Description -->
                  <fo:table-cell border="1pt solid #cccccc" padding="4pt" 
                                 display-align="before" text-align="left">
                    <fo:block font-size="9pt"><xsl:value-of select="Description"/></fo:block>
                  </fo:table-cell>
                  
                  <!-- Quantity (highlighted if > 100) -->
                  <fo:table-cell border="1pt solid #cccccc" padding="4pt" 
                                 display-align="center" text-align="center">
                    <fo:block font-size="9pt" font-weight="bold">
                      <xsl:value-of select="format-number($qty, '#,##0')"/>
                    </fo:block>
                  </fo:table-cell>
                  
                  <!-- Unit Price (red N/A if missing) -->
                  <fo:table-cell border="1pt solid #cccccc" padding="4pt" 
                                 display-align="center" text-align="right">
                    <xsl:choose>
                      <xsl:when test="$price != ''">
                        <fo:block font-size="9pt"><xsl:value-of select="format-number($price, '$#,##0.00')"/></fo:block>
                      </xsl:when>
                      <xsl:otherwise>
                        <fo:block font-size="9pt" font-weight="bold" color="red">N/A</fo:block>
                      </xsl:otherwise>
                    </xsl:choose>
                  </fo:table-cell>
                  
                  <!-- Line Total (red N/A if price missing) -->
                  <fo:table-cell border="1pt solid #cccccc" padding="4pt" 
                                 display-align="center" text-align="right">
                    <xsl:choose>
                      <xsl:when test="$price != ''">
                        <fo:block font-size="9pt"><xsl:value-of select="$totalPrice"/></fo:block>
                      </xsl:when>
                      <xsl:otherwise>
                        <fo:block font-size="9pt" font-weight="bold" color="red">N/A</fo:block>
                      </xsl:otherwise>
                    </xsl:choose>
                  </fo:table-cell>
                </fo:table-row>
              </xsl:for-each>

              <!-- Totals row - only displayed as footer element (handled in separate block) -->
            </fo:table-body>
          </fo:table>

          <!-- Totals section (appears after table to ensure on last page) -->
          <xsl:variable name="subtotal">
            <xsl:call-template name="calculate-total"/>
          </xsl:variable>
          
          <fo:block margin-top="12pt" text-align="right">
            <fo:table width="3.5in" border-collapse="collapse">
              <fo:table-column column-width="2.0in" border-right="1pt solid #cccccc"/>
              <fo:table-column column-width="1.5in" border-right="1pt solid #cccccc"/>
              <fo:table-body>
                <!-- Subtotal row -->
                <fo:table-row background-color="#f5f5f5" border-top="1pt solid #cccccc">
                  <fo:table-cell padding="6pt" text-align="right">
                    <fo:block font-size="9pt" font-weight="bold">Subtotal:</fo:block>
                  </fo:table-cell>
                  <fo:table-cell padding="6pt" text-align="right" border-left="1pt solid #cccccc">
                    <fo:block font-size="9pt">
                      <xsl:value-of select="format-number($subtotal, '$#,##0.00')"/>
                    </fo:block>
                  </fo:table-cell>
                </fo:table-row>
                
                <!-- Tax row -->
                <fo:table-row background-color="#f5f5f5">
                  <fo:table-cell padding="6pt" text-align="right">
                    <fo:block font-size="9pt" font-weight="bold">Tax (10%):</fo:block>
                  </fo:table-cell>
                  <fo:table-cell padding="6pt" text-align="right" border-left="1pt solid #cccccc">
                    <fo:block font-size="9pt">
                      <xsl:value-of select="format-number($subtotal * 0.10, '$#,##0.00')"/>
                    </fo:block>
                  </fo:table-cell>
                </fo:table-row>
                
                <!-- Total due row (grand total) -->
                <fo:table-row background-color="#1a4d99" border="1pt solid #1a4d99">
                  <fo:table-cell padding="8pt" text-align="right">
                    <fo:block font-size="11pt" font-weight="bold" color="white">TOTAL DUE:</fo:block>
                  </fo:table-cell>
                  <fo:table-cell padding="8pt" text-align="right" border-left="1pt solid #cccccc">
                    <fo:block font-size="11pt" font-weight="bold" color="white">
                      <xsl:value-of select="format-number($subtotal * 1.10, '$#,##0.00')"/>
                    </fo:block>
                  </fo:table-cell>
                </fo:table-row>
              </fo:table-body>
            </fo:table>
          </fo:block>

          <!-- Notes section -->
          <fo:block margin-top="24pt" font-size="9pt" border-top="1pt solid #cccccc" padding-top="12pt">
            <fo:block font-weight="bold" margin-bottom="6pt">Notes:</fo:block>
            <fo:block>• Items marked with yellow background indicate quantities exceeding 100 units.</fo:block>
            <fo:block>• Prices marked as "N/A" in red indicate missing unit price data.</fo:block>
            <fo:block>• Table headers repeat on each page for multi-page invoices.</fo:block>
            <fo:block>• Grand total with tax calculation appears on the final page.</fo:block>
          </fo:block>

          <!-- End of document marker for page number citation -->
          <fo:block id="end-of-doc"/>
        </fo:flow>
      </fo:page-sequence>
    </fo:root>
  </xsl:template>

</xsl:stylesheet>
