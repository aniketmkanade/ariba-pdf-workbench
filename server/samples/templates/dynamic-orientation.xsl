<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">

  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <!-- Root template -->
  <xsl:template match="/Report">
    <fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">
      <!-- Define page layout -->
      <fo:layout-master-set>
        <!-- Portrait page master -->
        <fo:simple-page-master master-name="portrait" page-height="11in" page-width="8.5in"
                               margin-top="0.5in" margin-bottom="0.5in"
                               margin-left="0.5in" margin-right="0.5in">
          <fo:region-body margin-top="0.75in" margin-bottom="0.5in"/>
          <fo:region-before extent="0.75in" region-name="header"/>
          <fo:region-after extent="0.5in" region-name="footer"/>
        </fo:simple-page-master>
        <!-- Landscape page master -->
        <fo:simple-page-master master-name="landscape" page-height="8.5in" page-width="11in"
                               margin-top="0.5in" margin-bottom="0.5in"
                               margin-left="0.5in" margin-right="0.5in">
          <fo:region-body margin-top="0.75in" margin-bottom="0.5in"/>
          <fo:region-before extent="0.75in" region-name="header"/>
          <fo:region-after extent="0.5in" region-name="footer"/>
        </fo:simple-page-master>
      </fo:layout-master-set>

      <!-- Summary section (portrait) -->
      <fo:page-sequence master-reference="portrait">
        <fo:static-content flow-name="header">
          <fo:block font-size="14pt" font-weight="bold" text-align="center">Report Summary</fo:block>
        </fo:static-content>
        <fo:static-content flow-name="footer">
          <fo:block text-align="center">Page <fo:page-number/></fo:block>
        </fo:static-content>
        <fo:flow flow-name="xsl-region-body">
          <fo:block font-size="12pt" margin-bottom="0.5in">
            <xsl:value-of select="Summary/Line"/>
          </fo:block>
        </fo:flow>
      </fo:page-sequence>

      <!-- Details section (landscape if >15 rows) -->
      <xsl:variable name="detailsMaster">
        <xsl:choose>
          <xsl:when test="count(Details/Row) > 15">landscape</xsl:when>
          <xsl:otherwise>portrait</xsl:otherwise>
        </xsl:choose>
      </xsl:variable>
      <fo:page-sequence master-reference="{$detailsMaster}">
        <fo:static-content flow-name="header">
          <fo:block font-size="14pt" font-weight="bold" text-align="center">Report Details</fo:block>
        </fo:static-content>
        <fo:static-content flow-name="footer">
          <fo:block text-align="center">Page <fo:page-number/></fo:block>
        </fo:static-content>
        <fo:flow flow-name="xsl-region-body">
          <fo:table width="100%" border="1pt solid black">
            <fo:table-header>
              <fo:table-row>
                <fo:table-cell padding="4pt"><fo:block font-weight="bold">Row #</fo:block></fo:table-cell>
                <fo:table-cell padding="4pt"><fo:block font-weight="bold">Data</fo:block></fo:table-cell>
              </fo:table-row>
            </fo:table-header>
            <fo:table-body>
              <xsl:for-each select="Details/Row">
                <fo:table-row>
                  <fo:table-cell padding="4pt"><fo:block><xsl:value-of select="position()"/></fo:block></fo:table-cell>
                  <fo:table-cell padding="4pt"><fo:block>Row data</fo:block></fo:table-cell>
                </fo:table-row>
              </xsl:for-each>
            </fo:table-body>
          </fo:table>
        </fo:flow>
      </fo:page-sequence>

      <!-- Conclusion section (always portrait) -->
      <fo:page-sequence master-reference="portrait">
        <fo:static-content flow-name="header">
          <fo:block font-size="14pt" font-weight="bold" text-align="center">Conclusion</fo:block>
        </fo:static-content>
        <fo:static-content flow-name="footer">
          <fo:block text-align="center">Page <fo:page-number/></fo:block>
        </fo:static-content>
        <fo:flow flow-name="xsl-region-body">
          <fo:block font-size="12pt">
            This concludes the report. The details section was rendered in <xsl:value-of select="$detailsMaster"/> orientation.
          </fo:block>
        </fo:flow>
      </fo:page-sequence>

    </fo:root>
  </xsl:template>

</xsl:stylesheet>